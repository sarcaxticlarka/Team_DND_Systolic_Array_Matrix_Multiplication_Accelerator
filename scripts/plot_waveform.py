#!/usr/bin/env python3
"""Render a GTKWave-style timing diagram (PNG) from sim/waves/tb_systolic_top.vcd
for the 'worked example' run, showing skewed operand injection and accumulation."""
import re, pathlib, sys
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

ROOT = pathlib.Path(__file__).resolve().parent.parent
VCD = ROOT/"sim/waves/tb_systolic_top.vcd"
N, W = 4, 8

def parse_vcd(path, wanted):
    ids, scope, vals, t = {}, [], {}, 0
    lines = open(path).read().split("\n")
    i = 0
    while i < len(lines):
        tok = lines[i].split()
        i += 1
        if not tok: continue
        if tok[0] == "$scope": scope.append(tok[2])
        elif tok[0] == "$upscope": scope.pop()
        elif tok[0] == "$var":
            name = ".".join(scope + [tok[4]])
            if name in wanted: ids.setdefault(tok[3], []).append(name); vals[name] = []
        elif tok[0] == "$enddefinitions": break
    for line in lines[i:]:
        if not line: continue
        c = line[0]
        if c == "#": t = int(line[1:])
        elif c in "01xz" and line[1:] in ids:
            for n in ids[line[1:]]: vals[n].append((t, line[0]))
        elif c == "b":
            v, k = line[1:].split()
            if k in ids:
                for n in ids[k]: vals[n].append((t, v))
    return vals

def at(series, t):
    v = None
    for ts, x in series:
        if ts > t: break
        v = x
    return v

def sval(bits, width=None, signed=True):
    if bits is None or any(ch in bits for ch in "xz"): return None
    n = int(bits, 2)
    w = width or len(bits)
    if signed and len(bits) >= w and bits[0] == "1": n -= 1 << w
    return n

T = "tb_systolic_top.dut."
wanted = {T+"clk", T+"start", T+"done", T+"busy", T+"u_ctrl.state", T+"u_ctrl.rd_k",
          T+"a_west", T+"v_west", T+"b_skewed", T+"c_flat", T+"cycle_count"}
v = parse_vcd(VCD, wanted)
starts = [t for t, x in v[T+"start"] if x == "1"]
t0 = starts[3] - 10_000              # 4th run = worked example (ps)
cyc = 16
times = [t0 + k*10_000 + 6_000 for k in range(cyc)]   # sample after posedge

state_name = {0: "IDLE", 1: "CLR", 2: "FEED", 3: "DRAIN", 4: "CAP", 5: "DONE"}
rows = []
rows.append(("start", [sval(at(v[T+"start"], t), signed=False) for t in times], "bit"))
rows.append(("FSM state", [state_name.get(sval(at(v[T+"u_ctrl.state"], t), signed=False), "?") for t in times], "bus"))
for i in range(N):
    rows.append((f"a_west[{i}]", [ (lambda b: None if b is None else sval(b.zfill(N*W)[(N-1-i)*W:(N-i)*W]))(at(v[T+"a_west"], t)) for t in times], "bus"))
for j in range(N):
    rows.append((f"b_north[{j}]", [ (lambda b: None if b is None else sval(b.zfill(N*W)[(N-1-j)*W:(N-j)*W]))(at(v[T+"b_skewed"], t)) for t in times], "bus"))
def acc(i, j):
    k = i*N + j
    return [ (lambda b: None if b is None else sval(b.zfill(N*N*32)[(N*N-1-k)*32:(N*N-k)*32]))(at(v[T+"c_flat"], t)) for t in times]
for (i, j) in [(0, 0), (1, 2), (3, 3)]:
    rows.append((f"acc PE({i},{j})", acc(i, j), "bus"))
rows.append(("done", [sval(at(v[T+"done"], t), signed=False) for t in times], "bit"))

# sized for a two-column IEEE page (7.16 in wide) so text prints at 7-9 pt
fig, ax = plt.subplots(figsize=(7.16, 0.235*len(rows) + 0.5))
H = 0.62
for r, (name, vals, kind) in enumerate(rows):
    y = len(rows) - r
    ax.text(-0.3, y, name, ha="right", va="center", fontsize=8.5, family="monospace")
    for k, val in enumerate(vals):
        if kind == "bit":
            lvl = y - H/2 + (H if val else 0)
            ax.plot([k, k+1], [lvl, lvl], color="#1f8a3a", lw=1.4)
            if k and vals[k-1] != val: ax.plot([k, k], [y-H/2, y+H/2], color="#1f8a3a", lw=1.4)
        else:
            new = (k == 0) or vals[k-1] != val
            col = "#e9f0fb" if val not in (0, None, "IDLE") else "white"
            ax.add_patch(plt.Polygon([[k+.08, y], [k+.18, y+H/2], [k+1, y+H/2], [k+1, y-H/2], [k+.18, y-H/2]] if new else
                                     [[k, y+H/2], [k+1, y+H/2], [k+1, y-H/2], [k, y-H/2]],
                                     closed=True, fc=col, ec="none"))
            ax.plot([k + (.18 if new else 0), k+1], [y+H/2]*2, color="#2b5fb3", lw=.9)
            ax.plot([k + (.18 if new else 0), k+1], [y-H/2]*2, color="#2b5fb3", lw=.9)
            if new:
                ax.plot([k+.08, k+.18], [y, y+H/2], color="#2b5fb3", lw=.9)
                ax.plot([k+.08, k+.18], [y, y-H/2], color="#2b5fb3", lw=.9)
                ax.text(k+.55, y, "–" if val is None else str(val), ha="center",
                        va="center", fontsize=8)
for k in range(cyc + 1):
    ax.axvline(k, color="#bbb", lw=.4, zorder=0)
    if k < cyc: ax.text(k+.5, len(rows)+.9, str(k), ha="center", fontsize=8, color="#555")
ax.text(cyc/2, len(rows)+1.5, "clock cycle (after start)", ha="center", fontsize=8, color="#555")
ax.set_xlim(-2.4, cyc); ax.set_ylim(0.4, len(rows)+1.75); ax.axis("off")
# title omitted: the report caption describes the figure
fig.tight_layout()
out = ROOT/"docs/figures/waveform_worked_example.png"
fig.savefig(out, dpi=300); print("wrote", out)
