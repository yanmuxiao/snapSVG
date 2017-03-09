// 页面元素
var icon = document.querySelector("#iconChrome"), 
	shape = document.querySelector("#shapeChorme"), 
	mini = document.getElementById("shapeMini");


// 默认位置
var rand_index = 2, rand_position = "bottom";




// SVG主体
var svg = Snap("#shapeSVG");
// 绘制个路径
svg.paper.path("").attr({
	fill: "rgba(255,255,255,.85)"	
});
// 路径元素
var path = svg.select("path");

// 完整数组包含8个点坐标，每个点坐标是类似[x,y]结构的子数组
// 路径总共8个点
/*
o----o----o
|         |
o         o
|         |
o----o----o
*/

var offset_rate = 4;
// 表示偏移比例
// 2表示中心点
// 4表示据某边缘1/4处，如下
// 这样会曲线周期长，效果好
/*
o----o----o
|         |
o         o
|         |
|         |
|         |
o----o----o
*/

// 获得坐标，获得路径的方法
var get = {
	points: function(element, position) {
		if (!element) return [];
		// 此位置用在展开状态元素上，获得的是四周8个点的坐标
		// 坐标和尺寸
		var rect = element.getBoundingClientRect();
		var width = element.clientWidth, height = element.clientHeight;
		
		var points = [];
		
		// 由于带有偏移计算，略复杂
		switch (position) {
			case "left": {
				/*
					o--------o----o
					|             |
					o             o
					|             |
					o--------o----o
				*/
				points = [
					[rect.left, rect.top],
					[rect.right - width/offset_rate, rect.top],
					[rect.right, rect.top],
					[rect.right, rect.top + height/2],
					[rect.right, rect.bottom],
					[rect.right - width/offset_rate, rect.bottom],
					[rect.left, rect.bottom],
					[rect.left, rect.top + height/2],
					[rect.left, rect.top]	// 这里与起始点重复，是为了完美闭合
				]
				break;
			}
			case "right": {
				/*
					o----o--------o
					|             |
					o             o
					|             |
					o----o--------o
				*/
				points = [
					[rect.left, rect.top],
					[rect.left + width/offset_rate, rect.top],
					[rect.right, rect.top],
					[rect.right, rect.top + height/2],
					[rect.right, rect.bottom],
					[rect.left + width/offset_rate, rect.bottom],
					[rect.left, rect.bottom],
					[rect.left, rect.top + height/2],
					[rect.left, rect.top]	// 这里与起始点重复，是为了完美闭合
				]
				break;
			}
			case "top": {
				/*
					o----o----o
					|         |
					|         |
					|         |
					o         o
					|         |
					o----o----o
				*/
				points = [
					[rect.left, rect.top],
					[rect.left + width/2, rect.top],
					[rect.right, rect.top],
					[rect.right, rect.bottom - height/offset_rate],
					[rect.right, rect.bottom],
					[rect.left + width/2, rect.bottom],
					[rect.left, rect.bottom],
					[rect.left, rect.bottom - height/offset_rate],
					[rect.left, rect.top]	// 这里与起始点重复，是为了完美闭合
				]
				break;
			}
			case "bottom": {
				/*
					o----o----o
					|         |
					o         o
					|         |
					|         |
					|         |
					o----o----o
				*/
				points = [
					[rect.left, rect.top],
					[rect.left + width/2, rect.top],
					[rect.right, rect.top],
					[rect.right, rect.top + height/offset_rate],
					[rect.right, rect.bottom],
					[rect.left + width/2, rect.bottom],
					[rect.left, rect.bottom],
					[rect.left, rect.top + height/offset_rate],
					[rect.left, rect.top]	// 这里与起始点重复，是为了完美闭合
				]
				break;
			}
		}
	
		return points;
	},
	point: function(element, position) {
		// 此位置用在图标元素上，也就是点击元素上，获得是是边缘3个点的坐标
		var rect = element.getBoundingClientRect();
		var width = element.clientWidth, height = element.clientHeight;
		// 中心点坐标
		var center_x = rect.left + width/2, center_y = rect.top + height/2;
		// 默认是中心点坐标
		var point = [[center_x, center_y], [center_x, center_y], [center_x, center_y]];
		switch (position) {
			case "left": {
				point = [[rect.right, rect.top], [rect.right, center_y], [rect.right, rect.bottom]];
				break;
			}
			case "right": {
				point = [[rect.left, rect.top], [rect.left, center_y], [rect.left, rect.bottom]];
				break;
			}
			case "top": {
				point = [[rect.left, rect.bottom], [center_x, rect.bottom], [rect.right, rect.bottom]];
				break;
			}
			case "bottom": {
				point = [[rect.left, rect.top], [center_x, rect.top], [rect.right, rect.top]];
				break;
			}
		}
		return point;
	},
	// 根据8个点坐标，绘制2此贝塞尔曲线路径
	// 返回值类似这样：M505 229Q960 229,1415 229Q1415 549.5,1415 870Q960 870,505 870Q505 549.5,505 229Z
	// 如有疑惑，可参考这里：http://www.zhangxinxu.com/wordpress/?p=4197
	path: function(array) {
		var d = "";
		array.forEach(function(point, index) {
			if (!point) return;
			var str = point.join(" ");
			if (index == 0) {
				d = d + "M" + str;	
			} else if (index % 2 == 1) {
				d = d + "Q" + str + ",";
			} else {
				d += str;
			}
		});
		
		d += "Z";
		
		return d;
	}
};

// 这是最重要的动画运动算法
var animate = function(from, to, direction, callback) {
	var trigger = [], target = [];
	// from 表示起始坐标
	// to 表示目的地坐标
	// 根据from, to的长度可以判定是trigger还是target
	// from, to都是数组
	// 数组虽然是表示8个点的坐标，但实际有9个数组项，因为闭合需要，起始点和终点坐标重复
	// 在本演示中，数组索引与点的对应关系是：左上，上中，右上，右中，右下，下中，左下，左中，左上
	if (from.length == 3) {
		// from为3值二维数组
		trigger = from;
		target = to;
	} else {
		// from为8值二维数组
		trigger = to;
		target = from;	
	}
	// direction 表示运动的方向
	direction = direction || "vertical";
	var i = direction == "vertical"? 1: 0;
	// callback为动画结束时候的回调
	callback = callback || function () {};
		
	// 移动方向的判断
	var position = "", data_position = [[
		{ 3: "right", 9: "left" }, { 9: "right", 3: "left" }
	], [
		{ 3: "bottom", 9: "top" }, { 9: "bottom", 3: "top" }
	]];
	// 我们需要知道目标（呈现元素）的中心点坐标[x, y]
	
	var target_center = [target[1][0], target[3][1]], trigger_center = trigger[1]; 
	// 在垂直方向，我们需要判断是top, 还是bottom
	
	// 确定方位，为下面一堆注释的缩写形式
	position = data_position[i][(trigger_center[i] > target_center[i]) * 1][from.length];
	
	/*if (i) {
		if (trigger[i] > target_center[i]) {
			// 点击元素在目标元素的下方
			if (from.length == 3) {
				position = "top";	
			} else {
				position = "bottom";	
			}
		} else {
			// 点击元素在上面
			if (from.length == 3) {
				position = "bottom";	
			} else {
				position = "top";	
			}
		}
	} else {
		if (trigger[i] > target_center[i]) {
			// 点击元素在目标元素的右方
			if (from.length == 3) {
				position = "left";	
			} else {
				position = "right";	
			}
		} else {
			// 点击元素在左侧
			if (from.length == 3) {
				position = "right";	
			} else {
				position = "left";	
			}
		}
	}*/
	
	
	// 每个点都是直接运动，由于延迟和本身是贝塞尔曲线的关系，就有有曲面效果了
	// 8个点的直线运动函数（线性函数，如果你想效果更屌，可以使用曲线函数）
	var move_fun = [], arr_pos_123 = [];
	// 因为首尾点是重合的，因此，循环到小于length-1
	for (var index=0; index<target.length-1; index++) {
		// 不同方位的对应点是不一样的
		if (i == 1) {
			// 垂直方位
			// 左中右
			arr_pos_123 = [[0,7,6], [1,5], [2,3,4]];
		} else {
			// 水平方向
			// 上中下
			arr_pos_123 = [[0,1,2], [7,3], [6,5,4]];
		}
		
		// 判断idnex在arr_pos_123的哪个数组中
		var index_match = -1;
		arr_pos_123.forEach(function(arr_pos, index_trigger) {
			if (index_match == -1 && arr_pos.indexOf(index) != -1) {
				index_match = index_trigger;
			}
		});
	
		// 斜率
		var rate = (target[index][1] - trigger[index_match][1]) / (target[index][0] - trigger[index_match][0]);
		// 函数尾巴常量
		var tail = target[index][1] - rate * target[index][0];
		// 塞入数组
		move_fun[index] = [rate, tail];	
		
		// console.log(move_fun[index]);
	}
	
	// 确定最大位移距离
	var distance = 0;
	// 实际上就是目标元素的高度或宽度啦（视方向而定）
	// 为了便于思考，统一正值
	if (i == 1) {
		distance = target[4][i] - target[2][i];
	} else {
		distance = target[2][i] - target[0][i];
	}
	
	// 动画执行
	// 为了保证动画充分
	// 我们选取最长水平/垂直距离作为变化的数值范围
	var start = 0, end = 0, data_start_end = {};
	
	// 如果是展开效果
	if (from.length == 3) {
		// 起始点肯定就是触发元素了
		start = from[0][i];
		
		data_start_end = {
			top: 2,
			bottom: 4,
			left: 0,
			right: 2	
		};
		
		// 这个源自下面注释的缩写，下同
		end = to[data_start_end[position]][i];
		
		/*if (i == 1) {			
			// 根据方位确定终点坐标
			switch (position) {
				case "top": {
					
					break;
				}
				case "bottom": {
					end = target[4][i];
					break;
				}
			}
		} else {
			switch (position) {
				case "left": {
					end = target[0][i];
					break;
				}
				case "right": {
					end = target[2][i];
					break;
				}
			}
		}*/
	} else {
		// 终止点就是触发元素了
		end = to[0][i];
		
		data_start_end = {
			top: 4,
			bottom: 2,
			left: 2,
			right: 0	
		};
		
		start = from[data_start_end[position]][i];
		
		/*if (i == 1) {
			switch (position) {
				case "top": {
					start = target[4][i];
					break;
				}
				case "bottom": {
					start = target[2][i];
					break;
				}
			}
		} else {
			switch (position) {
				case "left": {
					start = target[2][i];
					break;
				}
				case "right": {
					start = target[0][i];
					break;
				}
			}
		}*/	
	}
	
	// console.log([start, end].join("|"));
	
	// 动画执行
	Snap.animate(start, end, function (value) {
		// 8个点
		var p = [];
		// 三个关键轴
		var axis1 = 0, axis2 = 0, axis3 = 0;
		// 关键轴对应的关键点的索引值
		var arr_axis_points = [];
		
		// 确定初始位移坐标
		if (from.length == 3) {
			// 展开效果
			if (i == 1) {
				p = [from[0], from[1], from[2], from[2], from[2], from[1], from[0], from[0]];
			} else {
				p = [from[0], from[0], from[0], from[1], from[2], from[2], from[2], from[1]];
			}
		} else {
			// 收起效果
			p = [from[0], from[1], from[2], from[3], from[4], from[5], from[6], from[7]];
		}
		
		// 如果是展开效果
		if (from.length == 3) {
			switch (position) {
				case "left": {
					// 关键轴值
					axis1 = value;
					axis2 = value + distance / offset_rate;
					axis3 = value + distance;
					// 点击触发元素在右侧，形成向左的动画
					/*
						target    ←   axis1(start)-----axis2-----axis3
					*/
					// start → end的时候
					// 值是越来越小
					// axis1-3的位置是不断向左移动的
					// 但是，要开始运动，需要时机的
					// axis1一开始就运动 zxx: 实际上  axis1 < start时候运动，显然，这个一直成立，因此，省略了此if
					// 注意：
					// 此处为了方便大家了解原理，没有使用循环简化代码
					// 后面的都使用的代码更少但不太好理解的算法！
					if (axis1 <= end) {
						// 如果axis1走到头
						p[0] = to[0];
						p[7] = to[7];
						p[6] = to[6];
					} else {
						// 根据此时的横坐标(axis1值)计算出对应的纵坐标
						// y = a * x + b;  --你懂的
						p[0] = [axis1, move_fun[0][0] * axis1 + move_fun[0][1]];
						p[7] = [axis1, move_fun[7][0] * axis1 + move_fun[7][1]];
						p[6] = [axis1, move_fun[6][0] * axis1 + move_fun[6][1]];
					}
					
					// axis2的坐标超过start的时候（<start）
					if (axis2 < start) {
						if (axis2 <= to[1][0]) {
							// 超过了自己应该的位置
							p[1] = to[1];
							p[5] = to[5];
						} else {
							p[1] = [axis2, move_fun[1][0] * axis2 + move_fun[1][1]];
							p[5] = [axis2, move_fun[5][0] * axis2 + move_fun[5][1]];
						}
					}
					
					// axis3坐标超过start的时候
					if (axis3 < start) {
						if (axis3 <= to[2][0]) {
							p[2] = to[2];
							p[3] = to[3];
							p[4] = to[4];
						} else {
							p[2] = [axis3, move_fun[2][0] * axis3 + move_fun[2][1]];
							p[3] = [axis3, move_fun[3][0] * axis3 + move_fun[3][1]];
							p[4] = [axis3, move_fun[4][0] * axis3 + move_fun[4][1]];
						}
					}
					
					break;	
				}
				case "right": {
					// 关键轴值
					axis1 = value;
					axis2 = value - distance / offset_rate;
					axis3 = value - distance;
					// 向右的动画
					/*
						axis3----axis2----axis1(start)    →    target
					*/
					arr_axis_points = [[2,3,4], [1,5], [0,7,6]];
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						if (axis > start) {
							if (axis >= to[axis_points[0]][0]) {
								// 超出边界
								axis_points.forEach(function(point) {
									p[point] = to[point];
								});
							} else {
								axis_points.forEach(function(point) {
									p[point] = [axis, move_fun[point][0] * axis + move_fun[point][1]];
								});
							}
						}
					});
					
					break;	
				}
				case "top": {
					// 关键轴值
					axis1 = value;
					axis2 = value + distance / offset_rate;
					axis3 = value + distance;
					// 向上的展开动画
					/*
						target
						
						↑
						
						axis1
						|
						|
						axis2
						|
						|
						|
						axis3					
					*/
					arr_axis_points = [[0,1,2], [7,3], [6,5,4]];
					// 轴随着坐标变化而变化
					// 超过某一位置触发运动
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						if (axis <= to[axis_points[0]][1]) {
							// 超出边界
							axis_points.forEach(function(point) {
								p[point] = to[point];
							});
						} else if (axis <= start) {
							// 垂直方向
							// x = (y - b) / a;  --你懂的
							axis_points.forEach(function(point) {
								p[point] = [(axis - move_fun[point][1])/move_fun[point][0], axis];
							});
						}
					});
					break;
				}
				case "bottom": {
					// 关键轴值
					axis1 = value;
					axis2 = value - distance / offset_rate;
					axis3 = value - distance;
					// 向下的展开动画
					/*
						axis3
						|
						|
						|
						axis2
						|
						|
						axis1
						
						↓
						
						target					
					*/
					// 关键轴对应的关键点
					arr_axis_points = [[6,5,4], [7,3], [0,1,2]];
					// 同上注释
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						if (axis > start) {
							if (axis >= to[axis_points[0]][1]) {
								// 超出边界
								axis_points.forEach(function(point) {
									p[point] = to[point];
								});
							} else {
								// 垂直方向
								// x = (y - b) / a;  --你懂的
								axis_points.forEach(function(point) {
									p[point] = [(axis - move_fun[point][1])/move_fun[point][0], axis];
								});
							}
						}
					});
					break;
				}
			}
		} 
		// 如果是收起效果
		else {
			switch (position) {
				case "left": {
					axis1 = value - distance;
					axis2 = value - distance / offset_rate;
					axis3 = value;
					// 向左的收起动画
					/*
						target    ←     axis1--------axis2----axis3
					*/
					// 关键轴对应的关键点
					arr_axis_points = [[0,7,6], [1,5], [2,3,4]];
					// 收起动画直接奔向目的地就可以了
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						// 如果超出边缘的位置
						if (axis <= end) {
							axis_points.forEach(function(point) {
								p[point] = [to[0],to[0],to[0],to[1],to[2],to[2],to[2],to[1]][point];
							});
						} else {
							// 在旅行
							axis_points.forEach(function(point) {
								p[point] = [axis, move_fun[point][0] * axis + move_fun[point][1]];
							});	
						}
					});
					
					break;	
				}
				case "right": {
					axis1 = value + distance;
					axis2 = value + distance / offset_rate;
					axis3 = value;
					// 向右的收起动画
					/*
						axis3----axis2--------axis1    →     target
					*/
					// 关键轴对应的关键点
					arr_axis_points = [[2,3,4], [1,5], [0,7,6]];
					// 收起动画直接奔向目的地就可以了
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						// 如果超出点的位置
						if (axis >= end) {
							axis_points.forEach(function(point) {
								p[point] = [to[0],to[0],to[0],to[1],to[2],to[2],to[2],to[1]][point];
							});
						} else {
							// 在旅行
							axis_points.forEach(function(point) {
								p[point] = [axis, move_fun[point][0] * axis + move_fun[point][1]];
							});	
						}
					});
					
					break;	
				}
				case "top": {
					axis1 = value - distance;
					axis2 = value - distance / offset_rate;
					axis3 = value;
					// 向上的收起动画
					/*
						target
						
						↑
						
						axis1
						|
						|
						|
						axis2
						|
						|
						axis3					
					*/
					arr_axis_points = [[0,1,2], [7,3], [6,5,4]];
					// 轴随着坐标变化而变化
					// 超过某一位置触发运动
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						if (axis <= end) {
							// 超出边界
							axis_points.forEach(function(point) {
								p[point] = [to[0],to[1],to[2],to[2],to[2],to[1],to[0],to[0]][point];
							});
						} else {
							// 垂直方向
							// x = (y - b) / a;  --你懂的
							axis_points.forEach(function(point) {
								p[point] = [(axis - move_fun[point][1])/move_fun[point][0], axis];
							});
						}
					});
					break;
				}
				case "bottom": {
					axis1 = value + distance;
					axis2 = value + distance / offset_rate;
					axis3 = value;
					// 向下的收起动画
					/*
						axis3
						|
						|
						axis2
						|
						|
						|
						axis1
						
						↓
						
						target					
					*/
					arr_axis_points = [[6,5,4], [7,3], [0,1,2]];
					// 轴随着坐标变化而变化
					// 超过某一位置触发运动
					[axis1, axis2, axis3].forEach(function(axis, index) {
						var axis_points = arr_axis_points[index];
						if (axis >= end) {
							// 超出边界
							axis_points.forEach(function(point) {
								p[point] = [to[0],to[1],to[2],to[2],to[2],to[1],to[0],to[0]][point];
							});
						} else {
							// 垂直方向
							// x = (y - b) / a;  --你懂的
							axis_points.forEach(function(point) {
								p[point] = [(axis - move_fun[point][1])/move_fun[point][0], axis];
							});
						}
					});
					break;
				}
			}
		}
				
		p[8] = p[0];
		
		// console.log(p);
		
		// 路径绘制
		path.attr({
			d: get.path(p)
		});	
		
	}, 500, mina[from.length == 3? "easein": "easeout"], callback);	
};

// 事件以及初始化行为
var display = {
	direction: rand_index % 2 == 0? "vertical": "horizontal",
	show: function() {
		icon.className += " icon-chrome-active";
		shape.style.visibility = "visible";
		localStorage.clickMe = "true";
		localStorage.shapeChrome = "true";
		
		// 还原
		animate(get.point(icon, rand_position), get.points(shape, rand_position), this.direction, function() {
			shape.style.opacity = 1;	
		});
	},
	hide: function() {
		icon.className = "icon-chrome";
		shape.style.opacity = 0;
		localStorage.removeItem("shapeChrome");
		
		// 隐藏，也就是最小化
		animate(get.points(shape, rand_position), get.point(icon, rand_position), this.direction, function() {
			shape.style.visibility = "hidden";	
		});
	}	
};

icon.addEventListener("click", function() {
	var cl = this.className;
	if (/active/.test(cl)) {
		display.hide();
	} else {
		display.show();
		localStorage.clickMe = "true";
	}
});	

mini.addEventListener("click", function() {
	display.hide();
});


if (localStorage.shapeChrome == "true") {
	icon.className += " icon-chrome-active";
	shape.style.visibility = "visible";
	shape.style.opacity = 1;
}

window.addEventListener("resize", function() {
	// SVG重定位
	if (shape.style.visibility == "visible") {
		path.attr({
			d: get.path(get.points(shape, rand_position))
		});	
	}
});
