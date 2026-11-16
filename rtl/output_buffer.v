// ============================================================================
// output_buffer.v  --  Output / accumulator result registers
// Team DnD | Project 12
// ----------------------------------------------------------------------------
// On 'capture' all N*N accumulators are copied in parallel into a result
// register file. The array is then free to start the next multiplication
// while the host reads results through the (row, col) read port.
// ============================================================================
`timescale 1ns/1ps
module output_buffer #(
    parameter N     = 4,
    parameter ACC_W = 32,
    parameter IDX_W = (N <= 2) ? 1 : $clog2(N)
)(
    input  wire                  clk,
    input  wire                  rst,
    input  wire                  capture,
    input  wire [N*N*ACC_W-1:0]  c_flat,
    input  wire [IDX_W-1:0]      rd_row,
    input  wire [IDX_W-1:0]      rd_col,
    output wire [ACC_W-1:0]      rd_data
);
    reg [ACC_W-1:0] res [0:N*N-1];
    integer k;
    // Two-level read mux (row, then column) - no row*N multiplier for any N
    wire [N*ACC_W-1:0] row_sel [0:N-1];
    genvar r, c;
    generate
        for (r = 0; r < N; r = r + 1) begin : g_row
            for (c = 0; c < N; c = c + 1) begin : g_col
                assign row_sel[r][c*ACC_W +: ACC_W] = res[r*N + c];
            end
        end
    endgenerate
    wire [N*ACC_W-1:0] row_data = row_sel[rd_row];
    always @(posedge clk) begin
        if (rst) begin
            for (k = 0; k < N*N; k = k + 1) res[k] <= {ACC_W{1'b0}};
        end else if (capture) begin
            for (k = 0; k < N*N; k = k + 1) res[k] <= c_flat[k*ACC_W +: ACC_W];
        end
    end
    assign rd_data = row_data[rd_col*ACC_W +: ACC_W];
    
endmodule
