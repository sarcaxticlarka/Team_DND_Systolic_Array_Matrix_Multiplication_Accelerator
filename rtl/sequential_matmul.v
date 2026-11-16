// ============================================================================
// sequential_matmul.v  --  BASELINE: single-MAC sequential matrix multiplier
// Team DnD | Project 12
// ----------------------------------------------------------------------------
// Same host interface as systolic_top. Computes C = A x B with ONE MAC unit
// using the classic triple loop (i, j, k): N MAC cycles + 1 write-back cycle
// per output element -> N^2 * (N + 1) + 1 cycles in total.
// Used as the baseline for the speed-up / area comparison.
// ============================================================================
`timescale 1ns/1ps
module sequential_matmul #(
    parameter N      = 4,
    parameter DATA_W = 8,
    parameter ACC_W  = 32,
    parameter IDX_W  = (N <= 2) ? 1 : $clog2(N)
)(
    input  wire              clk,
    input  wire              rst,
    input  wire              wr_en,
    input  wire              wr_sel,
    input  wire [IDX_W-1:0]  wr_row,
    input  wire [IDX_W-1:0]  wr_col,
    input  wire [DATA_W-1:0] wr_data,
    input  wire              start,
    output reg               busy,
    output reg               done,
    output reg  [15:0]       cycle_count,
    input  wire [IDX_W-1:0]  rd_row,
    input  wire [IDX_W-1:0]  rd_col,
    output wire [ACC_W-1:0]  rd_data
);
    // {row, col} addressing (power-of-two stride) -> no address multiplier
    localparam PAD = 1 << IDX_W;
    reg [DATA_W-1:0] A [0:PAD*PAD-1];
    reg [DATA_W-1:0] B [0:PAD*PAD-1];
    reg [ACC_W-1:0]  C [0:PAD*PAD-1];

    always @(posedge clk) begin
        if (wr_en && !busy) begin
            if (!wr_sel) A[{wr_row, wr_col}] <= wr_data;
            else         B[{wr_row, wr_col}] <= wr_data;
        end
    end

    reg  [IDX_W-1:0] i, j, k;
    reg              mac_clear, mac_en;
    wire [ACC_W-1:0] acc;

    localparam S_IDLE = 2'd0, S_MAC = 2'd1, S_WB = 2'd2, S_DONE = 2'd3;
    reg [1:0] state;

    mac_unit #(.DATA_W(DATA_W), .ACC_W(ACC_W)) u_mac (
        .clk(clk), .rst(rst), .clear(mac_clear), .en(mac_en),
        .a(A[{i, k}]), .b(B[{k, j}]), .acc(acc)
    );

    always @(*) begin
        mac_en    = (state == S_MAC);
        mac_clear = (state == S_WB) || (state == S_IDLE);
    end

    always @(posedge clk) begin
        if (rst) begin
            state <= S_IDLE; busy <= 1'b0; done <= 1'b0; cycle_count <= 16'd0;
            i <= 0; j <= 0; k <= 0;
        end else begin
            done <= 1'b0;
            if (busy) cycle_count <= cycle_count + 16'd1;
            case (state)
            S_IDLE: if (start) begin
                        state <= S_MAC; busy <= 1'b1; cycle_count <= 16'd0;
                        i <= 0; j <= 0; k <= 0;
                    end
            S_MAC:  if (k == N-1) state <= S_WB;
                    else          k <= k + 1'b1;
            S_WB:   begin
                        C[{i, j}] <= acc;
                        k <= 0;
                        if (j == N-1) begin
                            j <= 0;
                            if (i == N-1) state <= S_DONE;
                            else begin i <= i + 1'b1; state <= S_MAC; end
                        end else begin
                            j <= j + 1'b1; state <= S_MAC;
                        end
                    end
            S_DONE: begin state <= S_IDLE; busy <= 1'b0; done <= 1'b1; end
            endcase
        end
    end

    assign rd_data = C[{rd_row, rd_col}];
endmodule
