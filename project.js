class Project 
{
	constructor (gl, ctx, text='') {
		this.gl = gl;
		this.ctx = ctx;
		this.uniforms = {};
		this.vectors = {};
		this.shaders = {};
		this.programs = {};
		this.meshes = {};
		this.amendments = '';
		this.js = '';
		text = text.split('\n');
	}
	execute () {
		let f = new Function ('project', this.js);
		f(this);
	}
	uniform (name,value) {this.uniforms[name] = value;}
	vector (name, dim, vector = new Vector (this.gl, name, dim)) {
		this.uniforms['r_' + name] = dim;
		this.vectors[name] = vector;
	}
	shader (name,text) {this.shaders[name] = text;}
	mesh (name,mesh,type) {
		return this.meshes[name] = this.gl.vertices.add_mesh(this.vectors[mesh][type](),name);
	}
	program (name, vs, fs, ins, outs, iterator, mesh) {
		let _ins = [], _outs = [], _uniforms = [];
		for (let i = 0; i < ins.length; i++) if (ins[i].length>0) _ins.push(this.vectors[ins[i]]);
		for (let i = 0; i < outs.length; i++) if (outs[i].length>0) _outs.push(this.vectors[outs[i]]);
		this.programs[name] = new Shader (
			this.gl, 
			vs.length>0?this.shaders[vs]:vs, 
			this.shaders[fs],
			_ins, _outs, iterator, 
			this.uniforms, 
			this.amendments,
			this.meshes[mesh]
		);
	}
	load (type, obj) {
		for (let e in obj) {
			if(type==='program')
				 this[type](e,...obj[e]);
			else this[type](e,obj[e]);
		}
	}
	fromText (text) {
		{ // comments
			text = text.replace(/\/\/[^\n]{0,}\n/g,'');
		}
		{ // uniforms
			this.uniform('time',0);
			let l = text.match(/u\s+([a-zA-Z0-9_.-]{0,})\s+[=:]\s(.+)\s{0,}\n/g);
			if (l) for (let i = 0; i < l.length; i++) {
				let x = l[i].match(/u\s+([a-zA-Z0-9_.-]{0,})\s+[=:]\s(.+)\s{0,}\n/);
				let name = x[1];
				let value = x[2];
				value = value.replace(/[\s\t]/g,'');
				value = value.match(/[\{\[\(]{0,1}([^\}\)\]\s]+)[\{\[\(]{0,1}/);
				value = value[1].split(',').map(x=>+x);
				this.uniform(name,value.length>1?value:value[0]);
			}
		}
		{ // vectors
			let l = text.match(/v[\s\t]+([a-zA-Z0-9_.-]{0,})\s{0,}:\s{0,}([^\}\)\]\n\s]+)\s{0,}\n/g);
			if (l) for (let i = 0; i < l.length; i++) {
				let x = l[i].match(/v\s+([a-zA-Z0-9_.-]{0,})\s{0,}:\s{0,}([^\}\)\]\n\s]+)\s{0,}\n/);
				let name = x[1];
				let value = x[2];
				value = value.match(/[\{\[\(]([^\}\)\]\n]+)[\{\[\(]/)||[0,value];
				value = value[1].split`,`;
				let dim = (
					value.length>1?value:(
						isNaN(Number(value[0]))?
							(
								Array.isArray(this.uniforms[value[0]])?
									this.uniforms[value[0]]:
									[this.uniforms[value[0]],1,1,1]
							) :
							[Number(value[0])]
					)
				);
				dim = dim.map(x=>+x);
				dim = dim.map(x=>isNaN(x)?0:x);
				for (let j = dim.length; j < 4; j++) dim.push(0);
				this.vector(name,dim);
			}
		}
		{// amendments
			let l = text.match(/\$([^\$]+)\$/);
			if (l) {
				this.amendments = l[1];
			}
		}
		{// shaders 
			let l = text.match(/(?<=[\s\t])s[\s\t]+([^\s\t\n]+)[\s\t\n\:]+((mesh|points|lines)([^\n]+)([^]+?(?=[\n\s\t]in)))?[\n\s\t]in([^\n]+)([^]+?(?=[\s\t\n]out))[\s\t\n]out([^\n]+)/g);
			if (l) for (let i = 0; i < l.length; i++) {
				let x = l[i].match(/s[\s\t]+([^\s\t\n]+)[\s\t\n\:]+((mesh|points|lines)([^\n]+)([^]+?(?=[\n\s\t]in)))?[\n\s\t]in([^\n]+)([^]+?(?=[\s\t\n]out))[\s\t\n]out([^\n]+)/);
				let fs = x[7];
				let name = x[1].replace(/[:=\n\s]/g,'');
				this.shader(name,fs);
				let ins  = x[6].replace(/[\[\]\{\}\(\)]/g,'').split(',').map(x=>x.replace(/[\t\s]/g,''));
				let outs = x[8].replace(/[\[\]\{\}\(\)]/g,'').split(',').map(x=>x.replace(/[\t\s]/g,''));
				if (!x[2]) this.program(name, '', name, ins, outs, 'U', 'sqr');
				else {
					let type = x[3].replace(/[\s\t\n]/g,'');
					let vs = x[5];
					let mesh = x[4].replace(/[\s\t\n]/g,'');
					mesh = this.mesh(name,mesh,type);
					this.shader('vs_'+name,vs);
					this.program(name, 'vs_'+name, name, ins,outs,'U',mesh);
				}
			}
		}
		{ // Execution
			//let (/([\s\t\n]+)set[\s\t]+([a-zA-Z0-9_\.\-])+[\s\t\n]{0,}[=:][\s\t\n]{0,}[\{\[\(]([^\}\]\)]{0,})[\)\}\]]/g,'');
			let tree = new Tree(text);
			tree.indentation();
			tree.lines();
			this.js = tree.execution();
			this.execute();
		}
	}
}
class Tree
{
	constructor (value, parent=null,  lvl= (parent?parent.lvl+1:0) ) {
		this.parent = parent;
		this.children = [value];
		this.lvl = lvl
	}
	set child (value) {
		this.children.push(
			new Tree (value,this,this.lvl+1)
		);
	}
	get child () {
		return this.children.length-1>0?this.children[this.children.length-1]:this;
	}
	execution () {
		let s = '';
		for (let j = 0; j < this.children.length; j++) {
			let c = this.children[j];
			if (c.children) s += c.execution();
			else {
				if (c.match(/animate/)) {
					s += `
					project.frame_rate = 60;
					project.frame_time = performance.now();
					project.uniforms.max_repeat = 1;
					let animate = () => {
						requestAnimationFrame(window.newAnimation?window.newAnimation:animate);
						let t = performance.now();
						window.newAnimation = false;
						${this.children[++j].execution()}
						project.uniforms.time++;
						let frame_rate = t-project.frame_time;
						project.frame_rate = .5*project.frame_rate+.5*frame_rate;
						project.frame_time = t;
						if (project.frame_rate<40)
						    project.uniforms.max_repeat = Math.max(1,project.uniforms.max_repeat+1);
						if (project.frame_rate>50)
						    project.uniforms.max_repeat = Math.max(1,project.uniforms.max_repeat-1);
					}
					if (window.newAnimation === undefined)
						animate();
					else window.newAnimation = animate;
					`;
				} else if (c.match(/^[\s\t]{0,}repeat/)) {
					let n = Number(c.match(/[\d]+/)[0]);
					s += `for (let i = 0; i < ${n}; i++) {
						${this.children[++j].execution()}
					}
					`;
				} else if (c.match(/^[\s\t]{0,}maxrepeat/)) {
					s += `for (let i = 0; i < project.uniforms.max_repeat; i++) {
						${this.children[++j].execution()}
					}
					`;
				} else if (c.match(/iFFT/)) {
					s += `project.vectors["${c.replace(/iFFT/,'').replace(/\s/g,'')}"].iFFT();`;
				} else if (c.match(/FFT/)) {
					s += `project.vectors["${c.replace(/FFT/,'').replace(/\s/g,'')}"].FFT();`;
				}  else if (c.match(/draw/)) {
					s += `project.programs["${c.replace(/draw/,'').replace(/\s/g,'')}"].draw();`;
				} else if (c.match(/display/)) {
					s += `project.vectors["${c.replace(/display/,'').replace(/\s/g,'')}"].display();`;
				} else if (c.match(/source/)) {
					let m = c.match(/source[\s\t]+([^\s\t\n]+)[\s\t]+([^\s\t\n]+)/);
					s += `
					{
						let img = document.getElementById("${m[2]}");
						if (!img) {
							img = document.createElement('img');
							img.src = "${m[2]}";
						}
						project.vectors["${m[1]}"].source(img);
					}`;
				} else if (c.match(/js/)) {
					s += c.replace(/[\s\t]{0,}js[\s\t]/,'') + ';';
				} else {
				}
			}
		}
		return s;
	}
	group (start, end) {
		for (let j = 0; j < this.children.length; j++) {
			let s = this.children[j];
			if (s.children) s.group(start,end); 
			else {
				for (let i = 0; i < s.length; i++) {
					if (s[i]===start) {
						let count = 0;
						for (let k = i; k < s.length; k++) {
							if (s[k]===start) count++;
							if (s[k]===end) {
								if (--count===0) {
									let a = s.substring(0,i+1);
									let b = s.substring(i+1,k);
									let c = s.substring(k);
									this.children.splice(j+1,0,c);
									this.children.splice(j+1,0,new Tree(b,this));
									this.children[j] = a
									i = k = s.length;
								}
							}
						}
					}
				}
			}
		}
	}
	indentation () {
		for (let j = 0; j < this.children.length; j++) {
			let s = this.children[j];
			if (s.children) s.indentation();
			else {
				let l = s.split`\n`;
				let tabs = l.map(x=>x.match(/^[\s\t]{0,}/)[0].length);
				for (let i = 0; i < l.length; i++) {
					if (tabs[i]>tabs[0]) {
						for (let k = i; k < l.length; k++) {
							if (tabs[k]<=tabs[0]||k===l.length-1) {
								
								let a = l.slice(0,i).join`\n`;
								let b = l.slice(i,k).join`\n`;
								let c = l.slice(k).join`\n`;
								this.children[j] = a;
								if (c.length>0) this.children.splice(j+1,0,c);
								this.children.splice(j+1,0,new Tree(b,this));
								k = l.length;
								i = l.length;
							}
						}
					}	
				}
			}
		}
	}
	lines () {
		for (let j = 0; j < this.children.length; j++) {
			let c = this.children[j];
			if (c.children) c.lines();
			else {
				this.children = [
					...this.children.slice(0,j),
					...c.split`\n`,
					...this.children.slice(j+1)
				];
			}
		}
	}
}