# Presentation Script — Team DnD

Systolic Array Matrix Multiplication Accelerator · Project 12, Modern Computer Architecture

Total speaking time: about **4:40 min** for 10 slides, plus questions.

| Speaker | Slides |
|---|---|
| Syed Darain Qamar | 1–3 |
| Md Sajjan | 4–5 |
| Sibtain Ahmed Qureshi | 6–7 |
| Abuzar Haideri | 8 |
| Antik Mondal | 9 |
| Syed Darain Qamar | 10 |

## Slide 1: Systolic Array Matrix Multiplication Accelerator

**Syed Darain Qamar** · about 0:20 min

Good morning. We are Team DnD, and our project is a Systolic Array Matrix Multiplication Accelerator.

In one line: we designed hardware in Verilog that multiplies matrices fast, using a grid of 16 small calculators working at the same time.

*On the slide:* The 4 × 4 grid on the right.

## Slide 2: Matrix multiplication powers AI, but one-by-one is slow

**Syed Darain Qamar** · about 0:30 min

Almost all of AI is matrix multiplication. Each box of C is one row of A times one column of B, added up.

Even a small 4 by 4 product needs 64 multiply-adds. With one calculator doing them one by one, that takes 81 clock cycles. We wanted to do them in parallel.

*On the slide:* A × B = C, then 64 and 81.

## Slide 3: The idea: a grid of tiny workers that pass numbers along

**Syed Darain Qamar** · about 0:30 min

Our answer is a systolic array. Like a heartbeat, data is pumped one step forward every clock tick. Like an assembly line, each worker multiplies, adds and passes the numbers on. And each number is read once but used four times.

Google's TPU chip uses the same idea. Now Sajjan will show how it is built.

*On the slide:* The three cards, left to right.

## Slide 4: How the pieces connect

**Md Sajjan** · about 0:30 min

Thank you. The host loads matrices A and B into input buffers. Delay blocks stagger the numbers. A enters the 4 by 4 grid from the left, B from the top.

When the work is done, all 16 answers go to the output registers. The controller tells every block when to start and stop.

*On the slide:* Trace left to right: host, buffers, delay, grid, output.

## Slide 5: One processing element does just three things

**Md Sajjan** · about 0:30 min

Each worker, called a processing element, does three things. It receives a from the left and b from above. It adds a times b to its own running total. And on the next tick it passes a to the right and b downwards.

The total never moves, so this is called output-stationary. We used 8-bit numbers with 32-bit totals, like real AI chips.

*On the slide:* The three steps, then the drawing.

## Slide 6: The trick: delay each row so the right numbers meet

**Sibtain Ahmed Qureshi** · about 0:30 min

Thank you. If all rows entered at once, the wrong numbers would meet. So row 1 waits one tick, row 2 waits two ticks, and the columns of B are delayed the same way.

Now the matching pair always reaches the right worker at the same moment: at time k plus i plus j.

*On the slide:* The dashed 'wait' boxes, then the formula.

## Slide 7: The controller runs six steps — 13 clock cycles in total

**Sibtain Ahmed Qureshi** · about 0:25 min

A state machine runs the steps: clear takes 1 cycle, feed 4, drain 7 and capture 1. That is 13 cycles, or 3N plus 1 in general.

We checked that 7 drain cycles is the minimum: with 6, the test fails.

*On the slide:* Walk along the boxes, then '13 cycles'.

## Slide 8: Tested step by step: 2,800 answers, 0 mistakes

**Abuzar Haideri** · about 0:30 min

We tested from the bottom up: the MAC unit, then one processing element, then the full 3 by 3 and 4 by 4 arrays with 224 matrix products. A separate Python program checked every answer again.

2,800 answers, zero mistakes. The waveform shows the staircase of inputs and the first total growing to 80, the correct answer.

*On the slide:* The two big numbers, then the waveform.

## Slide 9: Results: 6× fewer cycles, 7.9× faster on FPGA

**Antik Mondal** · about 0:35 min

At 4 by 4, our array needs 13 cycles against 81 for one multiplier. That is 6 times faster, and 23 times at 8 by 8.

On the FPGA, with pipelining, it runs at 127 megahertz using 16 multipliers and about 233 logic cells. One product takes 110 nanoseconds instead of 874: 7.9 times faster in real time.

*On the slide:* The 4×4 bars, then the four numbers.

## Slide 10: Thank you — questions?

**Syed Darain Qamar** · about 0:20 min

To sum up: 16 workers, exactly 13 cycles, zero mistakes, and 7.9 times faster than one multiplier.

Thank you. We are happy to take your questions.

*On the slide:* Pause and invite questions.

## Likely questions

**Why output-stationary?**  
The total never moves, so there are no adders between workers and the control is simple.

**Why do you need the delay (skew)?**  
So that row i of A and column j of B reach worker (i, j) at the same tick.

**Why 13 cycles?**  
Clear 1 + feed 4 + drain 7 + capture 1. Drain is 2N − 1; with 6 the test fails, so 7 is the minimum.

**Why does pipelining help if it adds a cycle?**  
It splits multiply and add, so the clock is 26% faster: 14 short cycles beat 13 long ones.

**What limits the speed-up?**  
Loading data one number per cycle (Amdahl's law). Real chips use wide memories.
