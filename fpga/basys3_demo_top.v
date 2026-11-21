// ============================================================================
// basys3_demo_top.v  --  Live FPGA demonstration wrapper (Digilent Basys-3)
// Team DnD | Project 12
// ----------------------------------------------------------------------------
//  btnU        : reset (re-loads the demo matrices)
//  btnC        : start C = A x B
//  sw[15]      : demo matrix set (0 = A=1..16, B=16..1 ; 1 = signed/identity set)
//  sw[3:2]     : result row,  sw[1:0] : result column
//  sw[4]       : 0 = show C[r][c] bits 15:0 on 7-segment, 1 = bits 31:16
//  led[15]     : result valid (latched 'done')      led[14] : busy
//  led[7:0]    : measured latency in clock cycles (cycle_count)
//  7-segment   : C[row][col] in hexadecimal
// ============================================================================
`timescale 1ns/1ps
module basys3_demo_top (
    input  wire        clk,        // 100 MHz
    input  wire        btnU,
    input  wire        btnC,
    input  wire [15:0] sw,
    output wire [15:0] led,
    output wire [6:0]  seg,
    output wire        dp,
    output wire [3:0]  an
);
    localparam N = 4;

    // ---------- synchronisers ----------
    reg [2:0] rst_s = 3'b111, btn_s = 3'b000;
    always @(posedge clk) begin
        rst_s <= {rst_s[1:0], btnU};
        btn_s <= {btn_s[1:0], btnC};
    end
    wire rst       = rst_s[2];
    wire start_req = btn_s[1] & ~btn_s[2];      // rising edge
    reg  set_q;
    always @(posedge clk) set_q <= sw[15];

    // ---------- demo matrix ROM ----------
    function [7:0] rom_a(input s, input [3:0] idx);
        rom_a = s ? ((idx[1:0] == idx[3:2]) ? 8'd2 : 8'd0)       // 2*I
                  : {4'd0, idx} + 8'd1;                         // 1..16
    endfunction
    function [7:0] rom_b(input s, input [3:0] idx);
        rom_b = s ? ({4'd0, idx} - 8'd8)                         // -8..7
                  : 8'd16 - {4'd0, idx};                        // 16..1
    endfunction

    // ---------- loader FSM: writes A and B after reset / set change ----------
    reg        loading, wr_en, wr_sel, set_l;
    reg [4:0]  ld_idx;
    always @(posedge clk) begin
        if (rst || (set_q != set_l)) begin
            loading <= 1'b1; ld_idx <= 0; wr_en <= 1'b0; set_l <= set_q;
        end else if (loading) begin
            wr_en  <= 1'b1;
            wr_sel <= ld_idx[4];
            if (ld_idx == 5'd31) loading <= 1'b0;
            ld_idx <= ld_idx + 1'b1;
        end else
            wr_en <= 1'b0;
    end
    reg [3:0] wr_addr_q; reg [7:0] wr_data_q;
    always @(posedge clk) begin
        wr_addr_q <= ld_idx[3:0];
        wr_data_q <= ld_idx[4] ? rom_b(set_l, ld_idx[3:0]) : rom_a(set_l, ld_idx[3:0]);
    end

    // ---------- accelerator ----------
    wire        busy, done;
    wire [15:0] cycle_count;
    wire [31:0] rd_data;
    systolic_top #(.N(N), .DATA_W(8), .ACC_W(32), .PIPE(1)) u_acc (
        .clk(clk), .rst(rst),
        .wr_en(wr_en), .wr_sel(wr_sel), .wr_row(wr_addr_q[3:2]), .wr_col(wr_addr_q[1:0]),
        .wr_data(wr_data_q),
        .start(start_req & ~loading), .busy(busy), .done(done), .cycle_count(cycle_count),
        .rd_row(sw[3:2]), .rd_col(sw[1:0]), .rd_data(rd_data));

    reg valid;
    always @(posedge clk) begin
        if (rst || loading) valid <= 1'b0;
        else if (done)      valid <= 1'b1;
    end
    assign led = {valid, busy, 6'd0, cycle_count[7:0]};

    // ---------- 4-digit multiplexed 7-segment display ----------
    wire [15:0] show = sw[4] ? rd_data[31:16] : rd_data[15:0];
    seven_seg_driver u_7seg (.clk(clk), .value(show), .seg(seg), .an(an));
    assign dp = 1'b1;
endmodule

// ----------------------------------------------------------------------------
module seven_seg_driver (
    input  wire        clk,
    input  wire [15:0] value,
    output reg  [6:0]  seg,      // active low, {g,f,e,d,c,b,a}
    output reg  [3:0]  an        // active low
);
    reg [17:0] div = 0;
    always @(posedge clk) div <= div + 1'b1;
    wire [1:0] digit = div[17:16];
    reg  [3:0] nib;
    always @(*) begin
        case (digit)
            2'd0: begin an = 4'b1110; nib = value[3:0];   end
            2'd1: begin an = 4'b1101; nib = value[7:4];   end
            2'd2: begin an = 4'b1011; nib = value[11:8];  end
            default: begin an = 4'b0111; nib = value[15:12]; end
        endcase
        case (nib)
            4'h0: seg = 7'b1000000; 4'h1: seg = 7'b1111001; 4'h2: seg = 7'b0100100;
            4'h3: seg = 7'b0110000; 4'h4: seg = 7'b0011001; 4'h5: seg = 7'b0010010;
            4'h6: seg = 7'b0000010; 4'h7: seg = 7'b1111000; 4'h8: seg = 7'b0000000;
            4'h9: seg = 7'b0010000; 4'hA: seg = 7'b0001000; 4'hB: seg = 7'b0000011;
            4'hC: seg = 7'b1000110; 4'hD: seg = 7'b0100001; 4'hE: seg = 7'b0000110;
            default: seg = 7'b0001110;
        endcase
    end
endmodule
