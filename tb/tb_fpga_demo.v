// tb_fpga_demo.v -- smoke test of the Basys-3 wrapper (loader + start + readout)
`timescale 1ns/1ps
module tb_fpga_demo;
    reg clk = 0, btnU = 1, btnC = 0; reg [15:0] sw = 0;
    wire [15:0] led; wire [6:0] seg; wire dp; wire [3:0] an;
    basys3_demo_top dut (.clk(clk), .btnU(btnU), .btnC(btnC), .sw(sw), .led(led), .seg(seg), .dp(dp), .an(an));
    always #5 clk = ~clk;
    integer r, c, err = 0;
    initial begin
        #100 btnU = 0; #600;              // loader writes 32 words
        btnC = 1; #50 btnC = 0; #400;
        if (!led[15]) begin $display("FAIL: result-valid LED not lit"); err = err + 1; end
        $display("latency LEDs = %0d cycles", led[7:0]);
        // set 0: A = 1..16, B = 16..1 -> C[0][0] = 80, C[3][3] = 386 (see report)
        sw[3:0] = 4'b0000; #20; if (dut.rd_data !== 80)  begin err = err + 1; $display("FAIL C00=%0d", dut.rd_data); end
        sw[3:0] = 4'b1111; #20; if (dut.rd_data !== 386) begin err = err + 1; $display("FAIL C33=%0d", dut.rd_data); end
        $display("RESULT: FPGA_DEMO %s", err ? "FAILED" : "PASSED");
        $finish;
    end
endmodule
