# Vivado non-project flow for Team DnD systolic accelerator.
# Run from the project root:   vivado -mode batch -source synth/vivado_build.tcl
# Produces utilisation + timing reports (official Artix-7 Fmax) and a bitstream.
set part xc7a35tcpg236-1
file mkdir synth/vivado_out
read_verilog [glob rtl/*.v] fpga/basys3_demo_top.v
read_xdc fpga/basys3.xdc
synth_design -top basys3_demo_top -part $part
opt_design; place_design; phys_opt_design; route_design
report_utilization    -file synth/vivado_out/utilization.rpt
report_timing_summary -file synth/vivado_out/timing_summary.rpt
report_power          -file synth/vivado_out/power.rpt
write_bitstream -force synth/vivado_out/basys3_demo_top.bit
# Fmax = 1000 / (10.0 - WNS) MHz  (WNS from timing_summary.rpt)
