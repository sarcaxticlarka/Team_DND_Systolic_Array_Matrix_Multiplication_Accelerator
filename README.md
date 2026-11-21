# Project 12 — Systolic Array Matrix Multiplication Accelerator

**Team DnD**

| Member | Enrollment |
|---|---|
| Syed Darain Qamar | 2401010472 |
| Md Sajjan | 2401010272 |
| Sibtain Ahmed Qureshi | 2401010454 |
| Abuzar Haideri | 2401010024 |
| Antik Mondal | 2401010084 |

A parameterised **output-stationary N×N systolic array** (default 4×4, also tested at 3×3) for **signed INT8 / Q3.4 fixed-point** matrix multiplication with 32-bit accumulators. It is written in synthesisable Verilog, verified with self-checking testbenches plus a NumPy golden model, and synthesised and placed-and-routed for FPGA. It is compared against a sequential single-MAC baseline and a pipelined-MAC variant.

**Final report (IEEE format):** [`DnD_Systolic_Array_Report.pdf`](DnD_Systolic_Array_Report.pdf). The LaTeX source is in [`report/main.tex`](report/main.tex) and can be uploaded to Overleaf as-is, together with `docs/figures/`.

**Demonstration video:** [watch on Google Drive](https://drive.google.com/file/d/1E0eEdf72pwOTkX3Pw1p8LjV24Erbv5UM/view?usp=sharing) (also linked in [`video/video.md`](video/video.md)).

**Presentation:** [`presentation/DnD_Systolic_Array_Presentation.pptx`](presentation/DnD_Systolic_Array_Presentation.pptx), with the speaker script in [`presentation/DnD_Presentation_Script.pdf`](presentation/DnD_Presentation_Script.pdf).

---

## Key results

| Metric | Value |
|---|---|
| Latency, one N×N product (measured = formula) | **3N + 1 cycles** (13 for 4×4) |
| Sequential 1-MAC baseline | N²(N+1)+1 cycles (81 for 4×4) |
| Cycle speed-up | 3.70× (3×3), **6.23× (4×4)**, 23.1× (8×8) |
| Fmax, 4×4, ECP5 post-route | 100.5 MHz, **127.0 MHz with pipelined MAC** |
| Wall-clock speed-up (4×4, pipelined vs baseline) | **7.9×** (110 ns vs 874 ns) |
| Throughput (4×4, pipelined) | 1.16 GOPS sustained, 4.06 GOPS peak |
| Artix-7 resources (4×4) | 233 LUT, 64 LUTRAM, 789 FF, 16 DSP48E1 |
| Verification | 224 matrix products / 2,800 elements, 0 mismatches (Verilog model **and** NumPy) |

All result tables are in [`docs/results_summary.md`](docs/results_summary.md) (auto-generated).

---

## Requirements checklist (brief → where it is)

### Project-12 specific
| Requirement | Deliverable |
|---|---|
| Processing Element (PE) | [`rtl/pe.v`](rtl/pe.v) |
| MAC unit | [`rtl/mac_unit.v`](rtl/mac_unit.v) (optional `PIPE=1` pipelined) |
| Input buffers | [`rtl/input_buffer.v`](rtl/input_buffer.v) and [`rtl/skew_buffer.v`](rtl/skew_buffer.v) |
| Output / accumulator registers | [`rtl/output_buffer.v`](rtl/output_buffer.v) |
| Systolic array controller | [`rtl/systolic_controller.v`](rtl/systolic_controller.v) (FSM) |
| Matrix data interface | [`rtl/systolic_top.v`](rtl/systolic_top.v) ports `wr_* / start / done / rd_*` |
| 3×3 or 4×4 array, fixed-point | `N` parameter; 3×3 and 4×4 both verified and synthesised; INT8/Q3.4 |
| Design one PE → verify MAC | [`tb/tb_mac_unit.v`](tb/tb_mac_unit.v) (74 checks), [`tb/tb_pe.v`](tb/tb_pe.v) (14 checks) |
| Connect PEs into array | [`rtl/systolic_array.v`](rtl/systolic_array.v) (generate loops) |
| Stream elements, verify vs reference model | [`tb/tb_systolic_top.v`](tb/tb_systolic_top.v) and [`scripts/verify_results.py`](scripts/verify_results.py) |
| Latency and throughput analysis | Report §V and [`docs/cycle_sweep.csv`](docs/cycle_sweep.csv), with plots in `docs/figures/` |
| Comparison with sequential multiplication | [`rtl/sequential_matmul.v`](rtl/sequential_matmul.v) and [`tb/tb_compare.v`](tb/tb_compare.v) |
| FPGA resource report | [`synth/reports/`](synth/reports/) and [`docs/resource_timing.csv`](docs/resource_timing.csv) |
| Matrix-multiplication demonstration | [`fpga/basys3_demo_top.v`](fpga/basys3_demo_top.v) plus the worked example in the TB log |

### Common requirements (Section 4)
| Requirement | Deliverable |
|---|---|
| Block diagram and explanation | Report Fig. 1, §III-A |
| Microarchitecture / state-transition description | Report Fig. 2 (PE), Fig. 3 and Table II (FSM) |
| Synthesisable modular Verilog | `rtl/` (9 modules, `iverilog -Wall` gives 0 warnings, Yosys synthesises cleanly) |
| Dedicated testbench, directed tests | `tb/` (5 testbenches, all self-checking) |
| Waveform verification | `sim/waves/*.vcd`, GTKWave layout `sim/waves/systolic_top.gtkw`, Report Fig. 4 |
| Quantitative metric | Latency, throughput (MAC/cycle, GOPS), speed-up |
| Synthesis: resources and Fmax | Report Table V (Artix-7 + ECP5 post-route Fmax) |
| Baseline / alternative comparison | Sequential 1-MAC baseline and pipelined-MAC alternative |
| Report and live demo | IEEE PDF, [demo video](https://drive.google.com/file/d/1E0eEdf72pwOTkX3Pw1p8LjV24Erbv5UM/view?usp=sharing), `demo.sh` and the Basys-3 demo |

### Report sections (IEEE format)
Abstract ✔ · Literature Review ✔ · Proposed Solution ✔ · Individual Contributions ✔ · References ✔ (17 IEEE-style references, numbered in order of citation). It also has Verification, Results and Conclusion sections.

---

## Folder structure
```
rtl/        mac_unit, pe, input_buffer, skew_buffer, systolic_array,
            output_buffer, systolic_controller, systolic_top, sequential_matmul
tb/         tb_mac_unit, tb_pe, tb_systolic_top, tb_compare, tb_fpga_demo
fpga/       basys3_demo_top.v (live demo), basys3.xdc (pin constraints)
synth/      reports/ (Yosys stats, nextpnr timing logs), vivado_build.tcl
sim/        log_*.txt (testbench output), matmul_log_N*.txt, perf_sweep.txt, waves/*.vcd
scripts/    run_sim.sh, run_synth.sh, verify_results.py, analyze.py, plot_waveform.py
docs/       results_summary.md, *.csv, figures/*.png
report/     main.tex (IEEEtran), main.pdf
presentation/  slides (.pptx/.pdf) and speaker script
video/      video.md (demonstration video link)
demo.sh     step-by-step terminal demo
run_all.sh  regenerates every result
```

## Run the demo
```bash
./demo.sh
```
Runs the MAC, PE and full 4×4 array tests, the NumPy check and the speed comparison step by step (press Enter between steps; `NOPAUSE=1 ./demo.sh` runs straight through).

## How to reproduce
```bash
brew install icarus-verilog yosys tectonic
```
```bash
python3 -m venv .venv && .venv/bin/pip install numpy matplotlib yowasp-nextpnr-ecp5
```
```bash
./run_all.sh
```
To run only the simulations: `./scripts/run_sim.sh`. To view waveforms: `gtkwave sim/waves/tb_systolic_top.vcd sim/waves/systolic_top.gtkw`.

### With Vivado / Basys-3 (official Xilinx timing and live demo)
```bash
vivado -mode batch -source synth/vivado_build.tcl
```
This writes the utilisation, timing and power reports and a bitstream to `synth/vivado_out/`. Fmax = 1000 / (10 − WNS) MHz.

**Demo controls:** `btnU` = reset/reload, `btnC` = start. `sw[3:2]`/`sw[1:0]` select the row/column of C. `sw[4]` shows the upper 16 bits. `sw[15]` switches between the two demo matrix pairs. The 7-segment display shows C[r][c] in hex. `led[15]` = done and `led[7:0]` = latency in cycles (14 with the pipelined MAC).
With set 0 (A = 1..16, B = 16..1), C[0][0] = 80 = `0x0050` and C[3][3] = 386 = `0x0182`.
