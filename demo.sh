#!/usr/bin/env bash
# Team DnD - live demo of the systolic array accelerator (for video / viva).
# Usage:  ./demo.sh             (press Enter between steps)
#         NOPAUSE=1 ./demo.sh   (run straight through)
cd "$(dirname "$0")"
RTL="rtl/mac_unit.v rtl/pe.v rtl/input_buffer.v rtl/skew_buffer.v rtl/systolic_array.v rtl/output_buffer.v rtl/systolic_controller.v rtl/systolic_top.v rtl/sequential_matmul.v"
B=$'\033[1m'; G=$'\033[32m'; C=$'\033[36m'; Y=$'\033[33m'; N=$'\033[0m'
mkdir -p sim/build sim/waves

step() { echo; echo "${C}${B}━━━ $1 ━━━${N}"; }
pause() { [ -n "$NOPAUSE" ] || read -r -p "${Y}  [press Enter to continue]${N} "; }
pass() { sed -E "s/(PASS(ED)?)/${G}${B}\1${N}/g"; }

clear 2>/dev/null
echo "${B}Systolic Array Matrix Multiplication Accelerator${N}"
echo "Team DnD  ·  Project 12, Modern Computer Architecture"
echo "Tools: Icarus Verilog $(iverilog -V 2>&1 | head -1 | awk '{print $4}')  ·  Python/NumPy"
pause

step "Step 1: MAC unit (multiply-accumulate) test"
iverilog -g2012 -o sim/build/mac -s tb_mac_unit $RTL tb/tb_mac_unit.v && vvp -n sim/build/mac | grep -v "long accumulation\|VCD\|finish" | pass
pause

step "Step 2: One processing element (PE) test"
iverilog -g2012 -o sim/build/pe -s tb_pe $RTL tb/tb_pe.v && vvp -n sim/build/pe | grep -v "stream forwarding\|VCD\|finish" | pass
pause

step "Step 3: Full 4x4 systolic array: C = A x B"
echo "A = [1..16] row by row,  B = [16..1] row by row"
iverilog -g2012 -o sim/build/top4 -s tb_systolic_top $RTL tb/tb_systolic_top.v && vvp -n sim/build/top4 > sim/build/top4.log
grep -A4 "worked example):" sim/build/top4.log
echo
grep -E "^  (PASS|FAIL) (identity|zero|ones|worked|mixed|extreme|diagonal|fixed)" sim/build/top4.log | pass
echo "  ... plus 3 back-to-back runs and 100 random matrices"
grep -E "matrix tests|LATENCY|RESULT" sim/build/top4.log | pass
pause

step "Step 4: Independent check of every answer with Python / NumPy"
PY=python3; [ -x .venv/bin/python ] && PY=.venv/bin/python
$PY scripts/verify_results.py sim/matmul_log_N4.txt | pass
pause

step "Step 5: Speed: systolic array vs one-multiplier design"
printf "  ${B}%-6s %-16s %-18s %s${N}\n" "Size" "Systolic cycles" "Sequential cycles" "Speed-up"
for n in 2 3 4 8; do
  iverilog -g2012 -P tb_compare.N=$n -o sim/build/cmp$n -s tb_compare $RTL tb/tb_compare.v
  vvp -n sim/build/cmp$n | awk -v n=$n -v g="$G" -v b="$B" -v z="$N" '/^PERF/ {
      split($3,s,"="); split($4,q,"=");
      printf "  %-6s %-16s %-18s %s%s%.1fx%s\n", n"x"n, s[2], q[2], g, b, q[2]/s[2], z }'
done
pause

step "Step 6: Waveform and result graphs"
echo "Opening the simulation waveform and graphs..."
[ -n "$NOOPEN" ] || open docs/figures/waveform_worked_example.png docs/figures/speedup_vs_N.png 2>/dev/null || echo "See docs/figures/"
echo
echo "${G}${B}Demo complete: all tests passed.${N}"
