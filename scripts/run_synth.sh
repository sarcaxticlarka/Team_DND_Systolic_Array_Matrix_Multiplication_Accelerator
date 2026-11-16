#!/usr/bin/env bash
# Open-source synthesis + place & route flow.
#  1) Yosys synth_xilinx  -> resource utilisation on Artix-7 (LUT/FF/DSP48E1/CARRY4)
#  2) Yosys synth_ecp5 + nextpnr-ecp5 -> placed & routed Fmax on Lattice ECP5-25F
# For official Xilinx timing use synth/vivado_synth.tcl inside Vivado.
set -e
cd "$(dirname "$0")/.."
RTL="rtl/mac_unit.v rtl/pe.v rtl/input_buffer.v rtl/skew_buffer.v rtl/systolic_array.v rtl/output_buffer.v rtl/systolic_controller.v rtl/systolic_top.v rtl/sequential_matmul.v"
NEXTPNR=".venv/bin/yowasp-nextpnr-ecp5"
mkdir -p synth/reports synth/build

run() {   # $1 = top, $2 = N, $3 = PIPE (systolic only)
  local TOP=$1 N=$2 PIPE=${3:-x} TAG=${1}_N${2}
  local CHP="chparam -set N $N $TOP;"
  if [ "$PIPE" != "x" ]; then CHP="chparam -set N $N -set PIPE $PIPE $TOP;"; [ "$PIPE" = 1 ] && TAG=${TAG}_pipe; fi
  echo "=== $TAG : Xilinx 7-series ==="
  yosys -q -l synth/reports/${TAG}_xc7.log -p "read_verilog $RTL; $CHP \
        synth_xilinx -family xc7 -top $TOP -flatten; tee -o synth/reports/${TAG}_xc7_stat.txt stat" >/dev/null
  echo "=== $TAG : ECP5 synth ==="
  yosys -q -l synth/reports/${TAG}_ecp5.log -p "read_verilog $RTL; $CHP \
        synth_ecp5 -top $TOP -json synth/build/${TAG}.json; tee -o synth/reports/${TAG}_ecp5_stat.txt stat" >/dev/null
  echo "=== $TAG : nextpnr-ecp5 place & route ==="
  $NEXTPNR --25k --package CABGA381 --json synth/build/${TAG}.json --freq 100 \
        --seed 1 --report synth/reports/${TAG}_pnr.json \
        > synth/reports/${TAG}_pnr.log 2>&1 || true
  grep -E "Max frequency for clock" synth/reports/${TAG}_pnr.log | tail -1
}
run systolic_top 3 0
run systolic_top 4 0
run systolic_top 4 1
run sequential_matmul 3
run sequential_matmul 4
