const FONT = "Courier New";
const LINE_SPACING  = 1.5;
const user_input = (ctx) => {
		document.onkeydown = (e) => {
	        ctx.ui.handle(e,"down");
	    };
	    document.onkeyup = (e) => {
	        ctx.ui.handle(e,"up");
	    };
	    ctx.scroll_dir = undefined;
	    ctx.canvas.onwheel = (e) => {
	    	if (Math.abs(e.deltaY)>0){
		    	e.preventDefault();
	            e.stopImmediatePropagation();
	            if (ctx.scroll_dir===undefined)ctx.scroll_dir=Math.sign(e.deltaY);
		        ctx.ui.wheel(e,ctx);
		    }  
	    };
	    ctx.canvas.onmousedown = (e) => {
	        // Mouse Start
	        ctx.mouse.xp=ctx.mouse.x = e.offsetX*ctx.dpr;
	        ctx.mouse.xp=ctx.mouse.y = e.offsetY*ctx.dpr;
	        ctx.mouse.down = true;
	        ctx.ui.mouse(e,'down',ctx);
	    };
	    ctx.canvas.onmouseout = ctx.canvas.onmouseup = (e) => {
	        // Mouse End
	        ctx.mouse.xp=ctx.mouse.x = 0;
	        ctx.mouse.xp=ctx.mouse.y = 0;
	        ctx.mouse.down = false;
	        ctx.ui.mouse(e,'end',ctx);
	    };
	    ctx.canvas.onmousemove = (e) => {
	        // Mouse Move
	        ctx.mouse.xp = ctx.mouse.down?ctx.mouse.x:0;
	        ctx.mouse.yp = ctx.mouse.down?ctx.mouse.y:0;
	        ctx.mouse.x = e.offsetX*ctx.dpr;
	        ctx.mouse.y = e.offsetY*ctx.dpr;
	        ctx.ui.mouse(e,'move',ctx);
	    };
	    ctx.canvas.onclick = (e) => {
	        // Mouse Click
	        ctx.mouse.x = e.offsetX*ctx.dpr;
	        ctx.mouse.y = e.offsetY*ctx.dpr;
	        ctx.mouse.element = ctx.mouse.hover;
	        ctx.ui.mouse(e,'click',ctx);
	    };
}
const rgba = (r,g,b,a) => {
    return "rgba("+
        Math.floor(r*255)+","+
        Math.floor(g*255)+","+
        Math.floor(b*255)+","+
        a+
    ")";
};
const get_ctx = (canvas,gl) => {
	const ctx = canvas_2d.getContext('2d');
	ctx.dpr = window.devicePixelRatio || 1;
    ctx.ui = new Element (0,0,ctx.w,ctx.h);
	window.onresize = () => {
		let h = window.innerHeight,
			w = window.innerWidth;
		gl.canvas.style.position=ctx.canvas.style.position = 'fixed';
		if (h<w) {
        	gl.canvas.height = ctx.ui.h = ctx.h = ctx.canvas.height = h*ctx.dpr;
       		gl.canvas.width = ctx.ui.w = ctx.w = ctx.canvas.width  = h*ctx.dpr;
			gl.canvas.style.left=ctx.canvas.style.left = ((w-h)/2)+'px';
			gl.canvas.style.top=ctx.canvas.style.top = '0px';
			gl.canvas.style.width=ctx.canvas.style.width = h+'px';
			gl.canvas.style.height=ctx.canvas.style.height = h+'px';
		} else {
	        gl.canvas.height = ctx.ui.h = ctx.h = ctx.canvas.height = w*ctx.dpr;
	        gl.canvas.width = ctx.ui.w = ctx.w = ctx.canvas.width  = w*ctx.dpr;
			gl.canvas.style.left=ctx.canvas.style.left = '0px';
			gl.canvas.style.top=ctx.canvas.style.top = ((h-w)/2)+'px';
			gl.canvas.style.width=ctx.canvas.style.width = w+'px';
			gl.canvas.style.height=ctx.canvas.style.height = w+'px';
		}
    };
    window.onresize();
    ctx.mouse = new Mouse();
    user_input(ctx,ctx.ui,ctx);
	return ctx;
};
const inset_box = (ctx,x,y,w,h) => {
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.lineJoin = "round";
	ctx.rect(x,y,w,h);
	ctx.clip();
	ctx.shadowColor = rgba(0,0,0,0);
	ctx.fill();
	ctx.shadowColor = rgba(0,0,0,1);
	ctx.strokeStyle = rgba(0,0,0,1);
	ctx.beginPath();
	ctx.rect(x-ctx.lineWidth,y-ctx.lineWidth,
			 w+ctx.lineWidth*2,h+ctx.lineWidth*2);
	ctx.stroke();
}
const inset_circle = (ctx,x,y,r) => {
	ctx.save();
	ctx.lineWidth = 10;
	ctx.beginPath();
	ctx.shadowBlur = 15;
	ctx.shadowOffsetX = -2;
	ctx.shadowOffsetY =  2;
	ctx.lineJoin = "round";
	ctx.arc(x,y,r,0,Math.PI*2);
	ctx.clip();
	ctx.shadowColor = rgba(0,0,0,0);
	ctx.fill();
	ctx.shadowColor = rgba(0,0,0,1);
	ctx.strokeStyle = rgba(0,0,0,1);
	ctx.beginPath();
	ctx.arc(x,y,r+ctx.lineWidth,0,Math.PI*2);
	ctx.stroke();
}
class Mouse {
	constructor () {
		this.x = 0;
		this.y = 0;
		this.xp=0;
		this.yp=0;
		this.down = false;
		this.style = 'default';
		this.hover = null;
		this.element = null;
		this.select = [0,0,0,0];
	}
}
class Element {
	constructor (x,y,w,h,free=true) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.deltaY = 0;
		this.free = free;
		this.text = '';
		this.active = false;
		this.elements = [];
		this.ancor = this.select = [0,0,0,0];
		this.parent = null;
		this.undo_redo = {
			index:0,
			array:[]
		};
		this.keys = {};
	}
	get copy () {
		let o = new this.constructor();
		for (let e in this) {
			if(this[e]&&Array.isArray(this[e])) {
				o[e] = [...this[e]];
				for (let i = 0; i < this[e].length; i++) 
					if (o[e][i].copy)
						o[e][i] = o[e][i].copy;
			} else o[e] = this[e];
		}
		return o;
	}
	set copy (o) {
		for (let e in o) {
		    if (e!=='deltaY') {
    			if(o[e]&&Array.isArray(o[e])) {
    				this[e] = [...o[e]];
    				for (let i = 0; i < o[e].length; i++) 
    					if (o[e][i].copy)
    						this[e][i] = o[e][i].copy;
    			} else this[e] = o[e];
		    }
		}
	}
	push (el) {
		this.elements.push(el);
		el.parent = this;
	}
	set selection (value) {
		if (typeof value === 'string') {
			value = value.split('\n');
			let s = this.select;
			if (this.elements.length<1) {
				let t = new Text('');
				this.elements.push(t);
			}
			let start = this.elements[s[0]].text.substring(0,s[1]);
			let end   = this.elements[s[2]].text.substring(s[3]);
			this.elements[s[0]].text = start+value[0];
			value[0] = this.elements[s[0]];
			for (let i = 1; i < value.length; i++)
				value[i] = new Text(value[i]);
			for (let i = 0; i < value.length; i++){
				let m = value[i].text.match(/^\~([0-9]+)\~/);
				if (m) {
					value[i].h = Number(m[1]);
					value[i].text=value[i].text.replace(m[0],'');
				}
			}
			this.elements.splice(s[0],s[2]-s[0]+1,...value);
			let x = value[value.length-1].text.length;
			this.select = [s[0]+value.length-1,x,s[0]+value.length-1,x];
			this.ancor = [...this.select];
			this.elements[this.select[0]].text += end;
		} else if (Array.isArray(value)) {
			for (let i = 0; i < value.length; i++) {
				this.selection = value[i];
			}
		} else {
			this.selection = "";
			this.elements.splice(this.select[0],0,value);
		}
		this.undo_redo.array.splice(this.undo_redo.index++,0,this.copy);
	}
	get selection () {
		let out = [];
		let s = this.select;
		for (let i = s[0]; i <= Math.min(s[0],s[2]); i++) {
			let e = this.elements[i];
			if (i>s[0]&&i<s[2]) out.push(e.text);
			else {
				let t = '';
				for (let j = (i===s[0]?s[1]:0); j < (i===s[2]?s[3]:e[i].text.length); j++) {
					t += e.text[j];
				}
				out.push(t);
			}
		}
		return out.join('\n');
	}
	inside (mouse,ctx) {
		return mouse.x>this.x&&mouse.y>this.y&&
		mouse.x-this.x<this.w&&mouse.y-this.y<((this.text.length>0)?(this.h*ctx.canvas.width/3.5e3):this.h);
	}
	keyEvent (key) {
		if (key==='Enter')
			this.selection = '\n';
		else if (key==='Shift') ;
		else if (key==='CapsLock') ;
		else if (key==='Meta') ;
		// arrows
			else if (key==='ArrowUp') {
				this.select[0]=Math.max(0,this.ancor[2]-1);
				this.select[1]=Math.min(this.ancor[3],this.elements[this.select[0]].text.length);
				this.select[2] = this.select[0];
				this.select[3] = this.select[1];
				this.ancor = [...this.select];
			}
			else if (key==='ArrowDown') {
				this.select[0]=Math.min(this.elements.length-1,this.ancor[2]+1);
				this.select[1]=Math.min(this.ancor[3],this.elements[this.select[0]].text.length);
				this.select[2] = this.select[0];
				this.select[3] = this.select[1];
				this.ancor = [...this.select];
			}
			else if (key==='ArrowLeft') {
				this.select[1]=this.ancor[3]-1;
				if (this.select[1]<0) {
					this.select[0]=Math.max(0,this.ancor[2]-1);
					this.select[1]=this.elements[this.select[0]].text.length;
				}
				this.select[2] = this.select[0];
				this.select[3] = this.select[1];
				this.ancor = [...this.select];
			}
			else if (key==='ArrowRight') {
				this.select[1]=this.ancor[3]+1;
				this.select[0]=this.ancor[2]
				if (this.select[1]>this.elements[this.ancor[2]].text.length){
					this.select[0]=Math.min(this.elements.length-1,this.ancor[2]+1);
					this.select[1]=0;
				}
				this.select[2] = this.select[0];
				this.select[3] = this.select[1];
				this.ancor = [...this.select];
			}
		else if (key==='Backspace') {
			this.select[1]--;
			if (this.select[1]<0) {
				this.select[0]=Math.max(0,this.select[0]-1);
				this.select[1]=this.elements[this.select[0]].text.length;
			}
			this.selection = '';
		}
		else if (key==='Delete') {
			this.select[3]++;
			if (this.select[3]>=this.elements[this.select[2]].length) {
				this.select[2]=Math.min(0,this.elements.length,this.select[2]+1);
				this.select[3]=this.elements[this.select[2]].text.length;
			}
			this.selection = '';
		}
		else if (this.keys['Meta']==='down'||this.keys['Control']==='down') {
			if (key==='Z'||this.keys['Shift']==='down') {
				let t = this.undo_redo.array[this.undo_redo.index++];	
				this.copy = t.copy;
			}
			else if (key==='z') {
				let t = this.undo_redo.array[--this.undo_redo.index-1];
				this.copy = t.copy;
			}
			else if (key==='c') {
			    navigator.clipboard.writeText(this.selection).then(function() {
                  /* clipboard successfully set */
                }, function() {
                  /* clipboard write failed */
                });
			}
			else if (key==='x') {
			    let e = this;
			    navigator.clipboard.writeText(this.selection).then(function() {
			        e.selection = ''
                }, function() {
                  /* clipboard write failed */
                });
			}
			else if (key==='v') {
			    navigator.clipboard.readText().then(
                    clipText => this.selection = clipText);
			}
		}
		else if (key==='Tab') {

			this.selection = '\t';
		}
		else this.selection = key;
	}
	mouse (event, action,  ctx, mouse = ctx.mouse) {
		if (action==='down') mouse.down = true;
		if (action==='end') mouse.down = false;
		for (let i= 0; i < this.elements.length; i++) {
			let e = this.elements[i];
			if (e.inside(mouse,ctx)) {
				e.mouse(event, action, ctx);
				let j = 0, h = (e.h*ctx.canvas.width/3.5e3);
				ctx.font = h+"px " + FONT;
				for (j = 0; j < e.text.length; j++) {
					let w = ctx.measureText(e.text.substring(0,j)).width;
					if (mouse.x-e.x<w+h/2) break;
				}
				if (action === 'down') {
					this.select[0] = this.select[2] = i;
					this.select[1] = this.select[3] = j;
					this.ancor = [i,j,i,j];
				} else if (action === 'move' && mouse.down) {
					if (i<this.ancor[0]||(i===this.ancor[0]&&j<=this.ancor[1])) {
						this.ancor[2] = this.select[0] = i;
						this.ancor[3] = this.select[1] = j;
						this.select[2] = this.ancor[0];
						this.select[3] = this.ancor[1];
					} else {
						this.select[0] = this.ancor[0];
						this.select[1] = this.ancor[1];
						this.ancor[2] = this.select[2] = i;
						this.ancor[3] = this.select[3] = j;
					}
				}
			}

		}
	}
	handle (event,action) {
	    if (event.key==='Tab') event.preventDefault();
		this.keys[event.key] = action;
		if (this.active && action=='down') {
			this.keyEvent(event.key);
		}
		else for (let i = 0; i < this.elements.length; i++) {
			this.elements[i].handle(event,action)
		}
	}
	wheel (event, ctx, mouse = ctx.mouse) {
		if (this.free) {
			//this.x += event.deltaX;
			this.deltaY = Math.min(this.deltaY-ctx.scroll_dir*event.deltaY,0);
		}
		for (let i = 0; i < this.elements.length; i++) {
			let e = this.elements[i];
			e.wheel(event, ctx);
		}
	}
	draw (ctx) {
		ctx.shadowColor = rgba(0,0,0,1);
		ctx.shadowBlur = 5;
		ctx.shadowOffsetX = -3;
		ctx.shadowOffsetY =  3;
		ctx.save();
		const grd = ctx.createLinearGradient(0+ctx.w*1.2,0,0,ctx.h*2);
	        grd.addColorStop(1,rgba(1,.1,0,.5));
	        grd.addColorStop(0,rgba(0,.5,1,.3));
	        ctx.fillStyle = rgba(1,1,1,.04);

		if (this.constructor!=Text)
			inset_box(ctx,this.x,this.y,this.w,this.h);
		ctx.fillStyle = rgba(1,1,1,1);
		ctx.shadowColor = rgba(0,0,0,1);
		ctx.shadowBlur = 4;
		ctx.shadowOffsetX =-3;
		ctx.shadowOffsetY = 3;
		let h = this.h;
		ctx.font = (h*ctx.canvas.width/3.5e3)+"px "+FONT;
		if (this.text.length>0) {
			this.measure = ctx.measureText(this.text);
			this.w = this.measure.width;
		}
		ctx.fillText(this.text,this.x,this.y+(h*ctx.canvas.width/3.5e3)*.75);
		ctx.shadowColor = rgba(0,0,0,.3);
		ctx.shadowBlur = 5;
		let y = this.y;
		for (let i = 0; i < this.elements.length; i++) {
			let el  = this.elements[i];
			//if (!el.free) {
			    
				el.x = this.x-el.w/2+this.w/2;//+ this.w/2- el.w/2;
				el.y = this.deltaY+y+ctx.h*0.025;
				if (el.constructor === Text)
				   y += LINE_SPACING*(el.h*ctx.canvas.width/3.5e3)
				else  y += el.h;
			//}
			el.draw(ctx);
		}
		if (this.active) {
			ctx.beginPath();
			for (let i = this.select[0]; i <= this.select[2]; i++) {
				let e = this.elements[i];
				ctx.font = (e.h*ctx.canvas.width/3.5e3)+"px "+FONT;
				let x = e.x, w = ctx.measureText(e.text).width;
				if (i===this.select[0]) {
					let m = ctx.measureText(e.text.substring(0,this.select[1])).width;
					x += m;
					w -= m;
				}
				if (i===this.select[2]) {
					let m = ctx.measureText(e.text.substring(this.select[3])).width;
					w -= m;
				}
				ctx.rect(x,e.y,w,(e.h*ctx.canvas.width/3.5e3));
			}
			ctx.shadowBlur = 8;
			ctx.shadowOffsetX = -1;
			ctx.shadowOffsetY = 1;
			ctx.shadowColor = ctx.fillStyle = rgba(.5,.5,.5,.4);
			ctx.fill();
			ctx.shadowColor = rgba(0,0,0,1);
			ctx.fillStyle = rgba(1,1,1,1);
			let e = this.elements[this.ancor[2]];
			ctx.font = (e.h*ctx.canvas.width/3.5e3)+"px "+FONT;
			let m = ctx.measureText(e.text.substring(0,this.ancor[3])).width;
			ctx.fillRect(e.x+m,e.y,2,(e.h*ctx.canvas.width/3.5e3));	
		}
		ctx.restore();
	}
	get string () {
		let t = this.text+'\n';
		for (let i = 0; i < this.elements.length; i++) {
			t += this.elements[i].string;
		}
		return t;
	}
}
class Display extends Element {
	constructor (vector={w:1,h:1,gl:{canvas:0}}) {
		super(0,0,vector.w,vector.h);
		this.canvas = vector.gl.canvas;
		this.vector = vector;
		this.text = '';
	}
	draw (ctx) {
		//super.draw(ctx);
		if (this.inside(ctx.mouse,ctx)){
			ctx.canvas.style.cursor = 'pointer';
			if (ctx.mouse.down) this.vector.mouse = [(ctx.mouse.x-this.x)/this.w,(this.h-ctx.mouse.y+this.y)/this.h,this.vector.mouse[0],this.vector.mouse[1]];
			else this.vector.mouse = [0,0,0,0];
		}
		else this.vector.mouse = [0,0,0,0];
		ctx.shadowColor = rgba(0,0,0,.5);
		ctx.shadowOffsetX = -2;
		ctx.shadowOffsetY = 2;
		ctx.shadowBlur = 3;
		let w = this.canvas.width;
		let h = this.canvas.height;
		this.canvas.width = this.vector.w;
		this.canvas.height = this.vector.h;
		this.w = Math.max(this.vector.w/ctx.dpr,.8*ctx.canvas.width);
		this.h = this.vector.h/this.vector.w*this.w;
		this.vector.display();
		let f = (this.h*ctx.canvas.width/3.5e3)
		ctx.font = f+"px "+FONT;
		ctx.fillText(this.text,this.x,this.y+f);
		ctx.drawImage(this.canvas,this.x,this.y,this.w,this.h);
		this.canvas.width = w;
		this.canvas.height = h;
	}
}
class Text extends Element {
	constructor (text) {
		super (0,0,1,92);
		this.text = text;
	}
	draw (ctx) {
		super.draw(ctx);
		if (this.inside(ctx.mouse,ctx)) ctx.canvas.style.cursor = 'text';
	}
}
class Button extends Element {
	constructor (text, onclick, x=0,y=0,w=42,h=42,free=false) {
		super(x,y,w,h,free);
		this.text = text;
		this.onclick = onclick;
	}
	mouse (event, action, ctx, mouse = ctx.mouse) {
		if (this.inside(mouse,ctx)&&action==='click') {
			this.onclick();
		}
	}
	draw (ctx) {
		super.draw(ctx);
		if (this.inside(ctx.mouse,ctx)) ctx.canvas.style.cursor = 'pointer';
		ctx.lineWidth = 2;
		ctx.strokeRect(this.x,this.y,this.w,this.h);
	}
}