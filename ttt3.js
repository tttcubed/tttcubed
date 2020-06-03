let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
ctx.resetTransform();
ctx.font = "24px sans-serif";
ctx.fillStyle = "#cccccc";
ctx.strokeStyle = "#cccccc";

let mini_selected = -1;
let micro_selected = -1;

function won(t) {
	let t2 = t;
	if(Array.isArray(t[1])) {
		t2 = {};
		for(let i = 0; i < 9; i++) {
			t2[i] = won(t[i]);
			if(t2[i] === false) {
				t2[i] = 0;
			}
		}
	}
	let res;
	if(t2[0] > 0 && t2[0] == t2[1] && t2[1] == t2[2]) {
		res = t2[0];
	} else if(t2[3] > 0 && t2[3] == t2[4] && t2[4] == t2[5]) {
		res = t2[3];
	} else if(t2[6] > 0 && t2[6] == t2[7] && t2[7] == t2[8]) {
		res = t2[6];
	} else if(t2[0] > 0 && t2[0] == t2[3] && t2[3] == t2[6]) {
		res = t2[0];
	} else if(t2[1] > 0 && t2[1] == t2[4] && t2[4] == t2[7]) {
		res = t2[1];
	} else if(t2[2] > 0 && t2[2] == t2[5] && t2[5] == t2[8]) {
		res = t2[2];
	} else if(t2[0] > 0 && t2[0] == t2[4] && t2[4] == t2[8]) {
		res = t2[0];
	} else if(t2[2] > 0 && t2[2] == t2[4] && t2[4] == t2[6]) {
		res = t2[2];
	} else {
		res = -1;
		for(let i = 0; i < 9; i++) {
			if(t2[i] == 0) {
				res = false;
			}
		}
	}
	return res;
}

function gen_board(fn) {
	let out = [];
	for(let i = 0; i < 9; i++) {
		out[i] = fn();
	}
	return out;
}

let board = gen_board(() => gen_board(() => gen_board(() => 0)));

function draw_board(board, x, y, thic, s, num) {
	let t = Math.floor(s / 3);
	ctx.lineWidth = thic;
	ctx.beginPath();
	let w = won(board);
	if(w == 1) {
		ctx.fillStyle = "rgb(" + Math.floor(191 / thic) + ",20,20)";
		ctx.fillRect(x, y, s, s);
	} else if(w == 2) {
		ctx.fillStyle = "rgb(20,20," + Math.floor(191 / thic) + ")";
		ctx.fillRect(x, y, s, s);
	} else if(w == -1) {
		ctx.fillStyle = "rgb(" + Math.floor(191 / thic) + "," + Math.floor(191 / thic) + ",20)";
		ctx.fillRect(x, y, s, s);
	} else if(num !== -1000) {
		if(thic == 1) {
			if((mini_allowed === -1 || mini_allowed === Math.floor(num / 9)) && (micro_allowed === -1 || micro_allowed === num % 9)) {
				ctx.fillStyle = "rgb(20,95,20)";
				ctx.fillRect(x - 2, y - 2, s + 4, s + 4);
			}
			if(mini_selected === Math.floor(num / 9) && micro_selected === num % 9) {
				ctx.strokeStyle = "rgb(20,255,20)";
				ctx.strokeRect(x - 1, y - 1, s + 2, s + 2);
			}
		} else if(thic == 2) {
			if(micro_selected === -1 && mini_selected === num) {
				ctx.strokeStyle = "rgb(20,255,20)";
				ctx.strokeRect(x - 1, y - 1, s + 2, s + 2);
			}
		}
	}
	ctx.fillStyle = "#cccccc";
	ctx.strokeStyle = "#cccccc";
	ctx.moveTo(x + t, y);
	ctx.lineTo(x + t, y + s);
	ctx.moveTo(x + t + t, y);
	ctx.lineTo(x + t + t, y + s);
	ctx.moveTo(x, y + t);
	ctx.lineTo(x + s, y + t);
	ctx.moveTo(x, y + t + t);
	ctx.lineTo(x + s, y + t + t);
	ctx.stroke();
	let i = 0;
	for(let _y = 0; _y < 3; _y++) {
		for(let _x = 0; _x < 3; _x++, i++) {
			if(Array.isArray(board[i])) {
				draw_board(board[i], x + _x * t + thic + 4, y + _y * t + thic + 4, thic / 2, t - thic - thic - 8, (w || num === -1000)? -1000: (num * 9 + i));
			} else if(board[i] == 1) {
				ctx.fillStyle = "rgb(255,20,20)";
				ctx.fillRect(x + _x * t + thic + 2, y + _y * t + thic + 2, t - thic - thic - 4, t - thic - thic - 4);
			} else if(board[i] == 2) {
				ctx.fillStyle = "rgb(20,20,255)";
				ctx.fillRect(x + _x * t + thic + 2, y + _y * t + thic + 2, t - thic - thic - 4, t - thic - thic - 4);
			}
		}
	}
	ctx.fillStyle = "#cccccc";
}

const RED = 1;
const BLUE = 2;
let can_play = false;
let turn = RED;
let side = RED;
let my_name = window.prompt("Username");
let room = window.prompt("Room code (blank to create new)").toLowerCase();
let opponent = "<nobody joined>";
let mini_allowed = -1;
let micro_allowed = -1;
let ask_rematch = false;

const ws = new WebSocket("wss://ttt3-server.glitch.me");

ws.onopen = () => {
	if(room === "") {
		board = gen_board(() => gen_board(() => gen_board(() => 0)));
		ws.send("crte" + my_name);
	} else {
		ws.send("join" + my_name + ";" + room);
	}
};

function dump() {
	let out = "dump" + side + ";" + turn + ";" + mini_allowed + ";" + micro_allowed + ";" + my_name;
	for(let i = 0; i < 9; i++) {
		for(let j = 0; j < 9; j++) {
			for(let k = 0; k < 9; k++) {
				out += ";" + board[i][j][k];
			}
		}
	}
	ws.send(out);
}

function draw() {
	if(can_play && side === turn) {
		document.title = "your turn | " + my_name + " vs " + opponent + " | tic tac toe³";
	} else {
		document.title = my_name + " vs " + opponent + " | tic tac toe³";
	}
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	draw_board(board, 0, 0, 4, 600, 0);
	if(mini_selected >= 0) {
		if(micro_selected >= 0) {
			draw_board(board[mini_selected][micro_selected], 608, 208, 2, 184, mini_selected * 9 + micro_selected);
		} else {
			draw_board(board[mini_selected], 608, 208, 2, 184, mini_selected);
		}
	}
	let w = won(board);
	let info1 = w === RED? "red won": (w === BLUE? "blue won": (w === -1? "tie": (turn === RED? "red's turn": "blue's turn")));
	let info3 = "room code " + room;
	if(w === -1) {
		ctx.fillStyle = "#bfbf14";
	} else if(w === RED || turn === RED) {
		ctx.fillStyle = "#bf1414";
	} else {
		ctx.fillStyle = "#1414bf";
	}
	let m = ctx.measureText(info1);
	ctx.fillText(info1, 800 - m.width, 24);
	if(side === RED) {
		ctx.fillStyle = "#bf1414";
	} else {
		ctx.fillStyle = "#1414bf";
	}
	m = ctx.measureText(my_name);
	ctx.fillText(my_name, 700 - m.width / 2, 96);
	ctx.fillStyle = "#cccccc";
	m = ctx.measureText("vs");
	ctx.fillText("vs", 700 - m.width / 2, 120);
	if(side === RED) {
		ctx.fillStyle = "#1414bf";
	} else {
		ctx.fillStyle = "#bf1414";
	}
	m = ctx.measureText(opponent);
	ctx.fillText(opponent, 700 - m.width / 2, 144);
	ctx.fillStyle = "#cccccc";
	m = ctx.measureText(info3);
	ctx.fillText(info3, 800 - m.width, 600 - 24);
	ctx.fillStyle = "#ffffff";
	if(ask_rematch) {
		m = ctx.measureText("rematch");
		ctx.fillText("rematch", 700 - m.width, 600 - 120);
		ctx.fillStyle = "#cccccc";
	}
}

ws.onmessage = data => {
	let msg = data.data;
	if(msg.startsWith("jind")) {
		opponent = msg.substring(4);
		dump();
		can_play = true;
	} else if(msg.startsWith("recv")) {
		let d = msg.substring(4).split(";");
		side = d[0] === "1"? BLUE: RED;
		turn = parseInt(d[1]);
		mini_allowed = parseInt(d[2]);
		micro_allowed = parseInt(d[3]);
		opponent = d[4];
		wons = {};
		let n = 5;
		for(let i = 0; i < 9; i++) {
			for(let j = 0; j < 9; j++) {
				for(let k = 0; k < 9; k++) {
					board[i][j][k] = d[n++];
				}
			}
		}
		if(mini_allowed !== -1) {
			mini_selected = mini_allowed;
		}
		if(mini_selected !== -1 && won(board[mini_selected])) {
			mini_selected = -1;
			micro_selected = -1;
		}
		if(micro_allowed !== -1) {
			micro_selected = micro_allowed;
		}
		if(mini_selected !== -1 && micro_selected !== -1 && won(board[mini_selected][micro_selected])) {
			micro_selected = -1;
		}
		can_play = true;
		if(won(board)) {
			mini_selected = -1;
			micro_selected = -1;
			can_play = false;
			ask_rematch = true;
		}
	} else if(msg.startsWith("crtd")) {
		room = msg.substring(4);
	} else if(msg == "left") {
		opponent = "<disconnected>";
		can_play = false;
	}
	draw();
};

draw();

function next_turn() {
	turn = turn === RED? BLUE: RED;
	if(won(board)) {
		mini_selected = -1;
		micro_selected = -1;
		mini_allowed = -1;
		micro_allowed = -1;
		can_play = false;
		ask_rematch = true;
	}
	dump();
}

canvas.addEventListener("click", event => {
	if(can_play && turn === side) {
		let rect = canvas.getBoundingClientRect();
		let x = event.clientX - rect.left;
		let y = event.clientY - rect.top;
		if(x < 600) {
			let bx = Math.floor(x / 200);
			let by = Math.floor(y / 200);
			let bbx = Math.floor(x % 200 / (200 / 3));
			let bby = Math.floor(y % 200 / (200 / 3));
			let mini = by * 3 + bx;
			let micro = bby * 3 + bbx;
			if((mini_allowed === -1 || mini_allowed === mini) && (micro_allowed == -1 || micro_allowed === micro) && !won(board[mini]) && !won(board[mini][micro])) {
				mini_selected = mini;
				micro_selected = micro;
			}
			draw();
		} else if(x >= 608 && x < 608 + 184 && y >= 208 && y < 208 + 184 && mini_selected !== -1) {
			let bx = Math.floor((x - 608) / (184 / 3));
			let by = Math.floor((y - 208) / (184 / 3));
			if(micro_selected == -1) {
				if(!won(board[mini_selected][by * 3 + bx])) {
					micro_selected = by * 3 + bx;
				}
			} else if(board[mini_selected][micro_selected][by * 3 + bx] === 0) {
				board[mini_selected][micro_selected][by * 3 + bx] = side;
				if(won(board[mini_selected][micro_selected])) {
					mini_selected = micro_selected;
					if(won(board[mini_selected])) {
						mini_selected = -1;
					}
				}
				mini_allowed = mini_selected;
				micro_allowed = by * 3 + bx;
				micro_selected = micro_allowed;
				if(mini_allowed !== -1 && won(board[mini_selected][micro_selected])) {
					micro_selected = -1;
					micro_allowed = -1;
				}
				if(micro_allowed !== -1) {
					if(mini_allowed !== -1 && won(board[mini_allowed])) {
						mini_allowed = -1;
					}
					if(mini_allowed === -1) {
						let won_all = true;
						for(let i = 0; i < 9; i++) {
							if(!won(board[i]) && !won(board[i][micro_allowed])) {
								won_all = false;
								break;
							}
						}
						if(won_all) {
							micro_allowed = -1;
						}
					}
				}
				next_turn();
			}
			draw();
		}
	} else if(ask_rematch) {
		let m = ctx.measureText("rematch");
		if(x >= 700 - m.width / 2 && x < 700 + m.width / 2 && y >= 600 - 120 - 24 && y < 600 - 120) {
			board = gen_board(() => gen_board(() => gen_board(() => 0)));
			mini_allowed = -1;
			micro_allowed = -1;
			mini_selected = -1;
			micro_selected = -1;
			dump();
			can_play = true;
			ask_rematch = false;
			draw();
		}
	}
}, false);