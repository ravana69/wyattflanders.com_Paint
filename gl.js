const shader_root = `#version 300 es
    #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
    #else
        precision mediump float;
    #endif
    #define Main void main ()
    #define LOOKUP(tx,u) texelFetch((tx),ivec2(u),0)
    #define _i42(u, iR4) ivec4((u)%(iR4).xy,(u)/(iR4).xy)
    #define _i24(v,iR4D) ivec2((v).xy+(v).zw*(iR4D).xy)
    #define _42(u,R4D) vec4(_i42(ivec2(u),ivec4(R4D)))
    #define _24(u,R4D) vec2(_i24(ivec4(u),ivec4(R4D)))
    #define ei(a) mat2(cos(a),-sin(a),sin(a),cos(a))
    vec4 LIN_LOOKUP1D (sampler2D tx, vec4 u) {
        float f = floor(u.x), c = ceil(u.x);
        vec4 a = LOOKUP(tx,vec4(f,u.yzw));
        vec4 b = LOOKUP(tx,vec4(c,u.yzw));
        return mix(a,b,fract(u.x));
    }
    vec4 LIN_LOOKUP2D (sampler2D tx, vec4 u) {
        float f = floor(u.y), c = ceil(u.y);
        vec4 a = LIN_LOOKUP1D(tx,vec4(u.x,f,u.zw));
        vec4 b = LIN_LOOKUP1D(tx,vec4(u.x,c,u.zw));
        return mix(a,b,fract(u.y));
    }
    vec4 vec(float x) {return vec4(x,0,0,0);}
    vec4 vec(float x, float y) {return vec4(x,y,0,0);}
    vec4 vec(float x, float y, float z) {return vec4(x,y,z,0);}
    vec4 vec(float x, float y, float z, float w) {return vec4(x,y,z,w);}
    vec4 vec(int x) {return vec4(x,0,0,0);}
    vec4 vec(int x, int y) {return vec4(x,y,0,0);}
    vec4 vec(int x, int y, int z) {return vec4(x,y,z,0);}
    vec4 vec(int x, int y, int z, int w) {return vec4(x,y,z,w);}
    vec4 vec(vec2 x) {return vec4(x,0,0);}
    vec4 vec(vec3 x) {return vec4(x,0);}
    vec4 vec(vec4 x) {return x;} 
    vec4 vec(ivec2 x) {return vec4(x,0,0);}
    vec4 vec(ivec3 x) {return vec4(x,0);}
    vec4 vec(ivec4 x) {return vec4(x);} 
    uniform vec2 R_;
    uniform vec4 R4_;
    #define pi 3.14159265359
    #define Im mat2(0,-1,1,0)
    #define Re mat2(1,0,0,1)
    float segment (vec2 p, vec2 a, vec2 b) {
        return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
    }
    float segment (vec3 p, vec3 a, vec3 b) {
        return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
    }
    float segment(vec4 p, vec4 a, vec4 b) {
        return length(p-a-(b-a)*clamp(dot(p-a,b-a)/dot(b-a,b-a),0.,1.));
    }
    float line (vec2 p, vec2 a, vec2 b) {
        return length(p-a-(b-a)*dot(p-a,b-a)/dot(b-a,b-a));
    }
    float line (vec3 p, vec3 a, vec3 b) {
        return length(p-a-(b-a)*dot(p-a,b-a)/dot(b-a,b-a));
    }
    float line (vec4 p, vec4 a, vec4 b) {
        return length(p-a-(b-a)*dot(p-a,b-a)/dot(b-a,b-a));
    }
    //----------------------------------------------------------------------------------------
    //  1 out, 3 in...
    float hash13(vec3 p3)
    {
        p3  = fract(p3 * .1031);
        p3 += dot(p3, p3.zyx + 31.32);
        return fract((p3.x + p3.y) * p3.z);
    }

    //----------------------------------------------------------------------------------------
    //  2 out, 1 in...
    vec2 hash21(float p)
    {
        vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.xx+p3.yz)*p3.zy);

    }

    //----------------------------------------------------------------------------------------
    ///  2 out, 2 in...
    vec2 hash22(vec2 p)
    {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yzx+33.33);
        return fract((p3.xx+p3.yz)*p3.zy);

    }

    //----------------------------------------------------------------------------------------
    ///  2 out, 3 in...
    vec2 hash23(vec3 p3)
    {
        p3 = fract(p3 * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yzx+33.33);
        return fract((p3.xx+p3.yz)*p3.zy);
    }

    //----------------------------------------------------------------------------------------
    //  3 out, 1 in...
    vec3 hash31(float p)
    {
       vec3 p3 = fract(vec3(p) * vec3(.1031, .1030, .0973));
       p3 += dot(p3, p3.yzx+33.33);
       return fract((p3.xxy+p3.yzz)*p3.zyx); 
    }


    //----------------------------------------------------------------------------------------
    ///  3 out, 2 in...
    vec3 hash32(vec2 p)
    {
        vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yxz+33.33);
        return fract((p3.xxy+p3.yzz)*p3.zyx);
    }

    //----------------------------------------------------------------------------------------
    ///  3 out, 3 in...
    vec3 hash33(vec3 p3)
    {
        p3 = fract(p3 * vec3(.1031, .1030, .0973));
        p3 += dot(p3, p3.yxz+33.33);
        return fract((p3.xxy + p3.yxx)*p3.zyx);

    }

    //----------------------------------------------------------------------------------------
    // 4 out, 1 in...
    vec4 hash41(float p)
    {
        vec4 p4 = fract(vec4(p) * vec4(.1031, .1030, .0973, .1099));
        p4 += dot(p4, p4.wzxy+33.33);
        return fract((p4.xxyz+p4.yzzw)*p4.zywx);
        
    }

    //----------------------------------------------------------------------------------------
    // 4 out, 2 in...
    vec4 hash42(vec2 p)
    {
        vec4 p4 = fract(vec4(p.xyxy) * vec4(.1031, .1030, .0973, .1099));
        p4 += dot(p4, p4.wzxy+33.33);
        return fract((p4.xxyz+p4.yzzw)*p4.zywx);

    }

    //----------------------------------------------------------------------------------------
    // 4 out, 3 in...
    vec4 hash43(vec3 p)
    {
        vec4 p4 = fract(vec4(p.xyzx)  * vec4(.1031, .1030, .0973, .1099));
        p4 += dot(p4, p4.wzxy+33.33);
        return fract((p4.xxyz+p4.yzzw)*p4.zywx);
    }

    //----------------------------------------------------------------------------------------
    // 4 out, 4 in...
    vec4 hash44(vec4 p4)
    {
        p4 = fract(p4  * vec4(.1031, .1030, .0973, .1099));
        p4 += dot(p4, p4.wzxy+33.33);
        return fract((p4.xxyz+p4.yzzw)*p4.zywx);
    }
    `
const vs_root = shader_root + `
    in vec2 _V;
    out vec2 V_;
    `
const fs_root = shader_root + `
    in vec2 V_;
    #define U_ gl_FragCoord.xy
`;
const vertex_shader = (outs=[],ins=[],vs='',iterator='U',uniforms={},amendments='') => {
    let s = vs_root;
    for (let i = 0; i < ins.length; i++) 
        s += `uniform sampler2D tx_${ins[i].name};
              uniform vec2 R_${ins[i].name};
              uniform vec4 R4_${ins[i].name};
              out vec4 V_${ins[i].name};
              out vec4 U_${ins[i].name};
              #define get_${ins[i].name}(u) LOOKUP(tx_${ins[i].name},clamp(_24(u,R4_${ins[i].name}),vec2(0),R-1.))
        `;
    for (let uniform in uniforms) {
        let type = uniforms[uniform].constructor === Array?'vec'+uniforms[uniform].length:'float';
        s += `uniform ${type} u_${uniform};
              ${type} ${uniform};
        `
    }
    s += amendments;
    s += `Main {`;
    for (let uniform in uniforms) {
        s += `${uniform} = u_${uniform};
        `;
    }
    s += `gl_PointSize = 1.;
                V_=_V;
                vec4 ${iterator} = vec(_V);
        `;
    for (let i = 0; i < ins.length; i++) {
        s +=   `V_${ins[i].name} = LOOKUP(tx_${ins[i].name}, V_);
                U_${ins[i].name} = _42(V_, R4_${ins[i].name});
                `;
    }
    s += vs + `
                gl_Position = vec4(${iterator}.xy*2.-1.,${iterator}.z*.01-1., 1);
            }
        `;
    return s;
}
const fragment_shader = (outs=[],ins=[],fs='',iterator='U4_',uniforms={},amendments='') => {
    let s = fs_root;
    for (let i = 0; i < outs.length; i++) 
        s += `layout(location = `+i+`) out vec4 `+ outs[i].name +`;`
    for (let i = 0; i < ins.length; i++) 
        s += `uniform sampler2D tx_${ins[i].name};
              uniform vec2 R_${ins[i].name};
              uniform vec4 R4_${ins[i].name};
              in vec4 V_${ins[i].name};
              in vec4 U_${ins[i].name};
              #define get_${ins[i].name}(u) LOOKUP(tx_${ins[i].name},_24(u,R4_${ins[i].name}))
        `;
    for (let uniform in uniforms) {
        let type = uniforms[uniform].constructor === Array?'vec'+uniforms[uniform].length:'float';
        s += `uniform ${type} u_${uniform};
              ${type} ${uniform};
        `
    }
    s += amendments;
    s += `Main {`;
    for (let uniform in uniforms) {
        s += `${uniform} = u_${uniform};
        `;
    }
    s += `vec4 ${iterator} = vec4(_42(U_,R4_));
            ${fs}
        }`
    return s;
}
class Texture {
    route(i=0) {
        this.gl.activeTexture(this.gl["TEXTURE" + i]);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.viewport(0, 0, this.w, this.h);
    }
    write(typedArray) {
        this.route();
        this.framebuffer.route();
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.type===this.gl.float?this.gl.RGBA32F:this.gl.RGBA, this.w, this.h, 0, this.gl.RGBA, this.type, typedArray);
    }
    source(element) {
        this.route();
        this.framebuffer.route();
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, element);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
    }
    toArray (x=0,y=0,dx=this.w,dy=this.h) {
        this.route();
        this.framebuffer.route();
        let pixels = new Float32Array(this.w * this.h * 4);
        this.gl.readPixels(x,y,dx,dy, this.gl.RGBA, this.gl.FLOAT, pixels);
        return pixels;
    }
    toUint8Array (x=0,y=0,dx=this.w,dy=this.h) {
        this.route();
        this.framebuffer.route();
        let pixels = new Uint8Array(this.w * this.h * 4);
        this.gl.readPixels(x,y,dx,dy, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixels);
        return pixels;
    }
    clear (gl=this.gl) {
        this.route();
        this.framebuffer.route();
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }
    constructor (gl, w, h, type=gl.FLOAT) {
        this.gl = gl;
        this.w = w;
        this.h = h;
        this.type = type;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        let format = gl.RGBA32F;
        if (this.type != gl.FLOAT) format = gl.RGBA;
        gl.texImage2D(gl.TEXTURE_2D, 0, format, w, h, 0, gl.RGBA, this.type, null);
        this.framebuffer = new Framebuffer(gl,[this]);
    }
}
class Framebuffer {
    route () {
        let gl = this.gl;
        let drawBuffers = new Array(this.nBuffers);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        for (let i = 0; i < drawBuffers.length; i++) {
            drawBuffers[i] = gl.COLOR_ATTACHMENT0+i;
            this.textures[i].route(i);
            gl.bindTexture(gl.TEXTURE_2D, this.textures[i].texture);
            gl.framebufferTexture2D(gl.DRAW_FRAMEBUFFER, drawBuffers[i], gl.TEXTURE_2D, this.textures[i].texture, 0);
        }
        gl.drawBuffers(drawBuffers);
    }
    constructor (gl, textures) {
        this.gl = gl;
        this.textures = textures;
        this.w = 0;
        this.h = 0;
        for (let i = 0; i < textures.length; i++) {
            let v = textures[i];
            if (v.w>this.w) this.w = v.w;
            if (v.h>this.h) this.h = v.h;
        }
        this.width = this.w;
        this.height = this.h;
        this.nBuffers = textures.length;
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        this.renderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer);

        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.w, this.h);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
    } 
}
const draw = (gl, program, dest, a = 0, b = 6, clear = false, type = gl.TRIANGLES) => {
    gl.useProgram(program);
    if (dest.constructor === Framebuffer) dest.route();
    else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0,0,dest.width||dest.w,dest.height||dest.w);
    if (clear) gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status!==36053) console.log(status);
    gl.drawArrays(type, a, b);
}
const setUni = (gl, program, name, args, int = false) => {
    gl.useProgram(program);
    if (!program[name]) program[name] = gl.getUniformLocation(program, name);
    if (args.constructor == Texture) {
        args.route(int);
        gl.uniform1i(program[name], int);
    }
    else if (int || typeof (args) == "boolean") gl.uniform1i(program[name], args);
    else if (args.constructor == Array) gl["uniform" + args.length + "fv"](program[name], args);
    else if (typeof (args) == "number") gl.uniform1f(program[name], args);
    return setUni;
};
const get_gl = (canvas) => {
    let 
    gl = canvas.getContext('webgl2',{antialias: false}),
    ext = gl.getExtension('EXT_texture_float'),
    lin = gl.getExtension('EXT_texture_float_linear'),
    dbf = gl.getExtension('WEBGL_draw_buffers'),
    fco = gl.getExtension('EXT_color_buffer_float');
    gl.canvas = canvas;
    //canvas.style.display = 'none';
    gl.vertices = new Vertices(gl);
    gl.add_mesh = gl.vertices.add_mesh;
    return gl;
};
const createProgram = (gl, vstr, fstr) => {
    let program = gl.createProgram();
    let vshader = createShader(gl, vstr, gl.VERTEX_SHADER);
    let fshader = createShader(gl, fstr, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw gl.getProgramInfoLog(program);
    }
    program.vs = vstr;
    program.fs = fstr;
    return program;
};
const createShader = (gl, str, type) => {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, str);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        var errorString = gl.getShaderInfoLog(shader);
        str = str.split('\n');
        for (let i = 0; i < str.length; i++) {
            str[i] = (i+1)+str[i];
        }
        str = str.join('\n');
        console.log(errorString + '\nError : '+str.split('\n')[errorString.split(':')[2]-1]);
        throw gl.getShaderInfoLog(shader);
    }
    return shader;
};

class FFT {
    FFT  (sign = 1)  {
        this.uniforms.sign = sign;
        this.reverse.draw();
        for (let j = 0; j < 4; j++) if (this.vector.dim[j]>1) {
            this.uniforms.direction = j;
            for (let i = 0; i < this.uniforms.n_stages[j]; i++) {
                this.uniforms.stage = i;
                this.ft.draw();
            }
        }
        return [this.vector];
    }
    iFFT () {return this.FFT(-1);}
    constructor (gl, vector, iterator='W') {
        this.uniforms = {
            stage : 0,
            sign : 1,
            direction : 0,
            n_stages : new Array(4),
        };
        let suffix = 'xyzw', name = vector.name;
        this.reverse_fs = `ivec4 N = ivec4(n_stages), u = ivec4(0);`;
        for (let j = 0; j < 4; j++) {
            let c = suffix[j];
            this.reverse_fs += `
                for (int i = 0; i < N.${c}; i++) {
                    if ((int(${iterator}.${c}) & (1<<i)) > 0)
                        u.${c} |= (1 << ((N.${c} - 1) - i));
                }
                `
        }
        this.reverse_fs += `${name} = get_${name}(u);`;
        this.ft_fs = `
            vec4 u = ${iterator};
            vec4 a = get_${name}(u);
            int d = int(direction);
            u[d] = float(int(${iterator}[d])^(1<<int(stage)));
            vec4 b = get_${name}(u);
            if (u[d]<${iterator}[d]) ${name} = b-a; else ${name} = a+b;
            int i = int(${iterator}[d]);
            int k = ( i % ((1<<(int(stage) + 1))) ) * ( ((i / (1<<(int(stage) + 1))) % 2 ) * ( 1<<(int(n_stages[d]-stage)-2)) );
            mat2 m = ei(sign*2.*pi/R4_[d]*float(k))*${Math.sqrt(.5)};
            ${name}.xy *= m;
            ${name}.zw *= m;
            `;
        this.vector = vector;
        this.iterator = iterator;
        for (let i = 0; i < 4; i++) this.uniforms.n_stages[i] = Math.log2(vector.dim[i]);
        this.reverse = new Shader (gl, '',this.reverse_fs,[vector], [vector], iterator, this.uniforms);
        this.ft = new Shader(gl, '', this.ft_fs, [vector], [vector], iterator, this.uniforms);
    }
}
class Vertices {
    add_mesh (mesh,name) {
        let gl = this.gl;
        this[name+'_start'] = this.arr.length/2;
        this[name+'_end'] = mesh.length/2;
        this[name+'_type'] = mesh.drawType;
        this.arr = this.arr.concat(mesh);
        let buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.arr), gl.STATIC_DRAW);
        gl.useProgram(this.program);
        let attrib = gl.getAttribLocation(this.program, '_V');
        gl.enableVertexAttribArray(attrib);
        gl.vertexAttribPointer(attrib, 2, gl.FLOAT, gl.FALSE, 0, 0);
        return name;
    }
    constructor (gl) {
        this.gl = gl;
        this.program = createProgram(gl,vertex_shader(),fragment_shader());
        let sqr = [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1];
        this.arr = sqr;
        sqr.drawType = gl.TRIANGLES;
        this.add_mesh(sqr,'sqr');
    }
}
class Vector {
    mesh () {
        if (this.dim[2]>1) return 'must be 2D set';
        let w = this.dim[0], h = this.dim[1],
            arr = new Array(w * h * 6), sqr = [0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 0, 1], i = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                for (let k = 0; k < 6; k++) {
                    arr[i++] = (x+sqr[k*2+0])+.5;
                    arr[i++] = (y+sqr[k*2+1])+.5;
                }
            }
        }
        arr.drawType = this.gl.TRIANGLES;
        return arr;
    }
    points () {
        let w = Math.max(1,this.dim[0])*Math.max(1,this.dim[2]), h = Math.max(1,this.dim[1])*Math.max(1,this.dim[3]),
            arr = new Array(w * h * 2 ), i = 0;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                arr[i++] = (x)+.5;
                arr[i++] = (y)+.5;
            }
        }
        arr.drawType = this.gl.POINTS;
        return arr;
    }
    lines () {
        let w = this.dim[0],
            arr = new Array(w * 2 ), i = 0;
        for (let x = 0; x < w; x++) {
            arr[i++] = (x)+.5;
            arr[i++] = .5;
        }
        arr.drawType = this.gl.LINES;
        return arr;
    }
    get texture () {
        return (this.current>=0)?this.textures[this.current%this.textures.length]:this.intTexture;
    }
    next () {
        this.current++;
    }
    display (gl=this.gl) {
        gl.canvas.width = this.w;
        gl.canvas.height = this.h;
        setUni(gl,this.display_program,"IN0",this.texture,0);
        draw(gl,this.display_program,gl.canvas);
    }
    toArray (gl=this.gl) {
        return this.texture.toArray();
    }
    toUint8Array (x=0,y=0,dx=this.w,dy=this.h) {
        return this.texture.toUint8Array();
    }
    write(typedArray) {
        this.texture.write(typedArray);
    }
    source(element) {
        this.intTexture.source(element);
        this.current = -1;
    }
    
    clear (gl=this.gl) {
        this.texture.clear(gl);
    }
    FFT (sign = 1) {return this.myFFT.FFT(sign);}
    iFFT () {return this.FFT(-1);}
    get dimensions () {return this.dim;}
    set dimensions (dim) {
        let gl = this.gl;
        this.dim = dim.concat(); // 4D dimensions
        this.dim[0] = Math.max(this.dim[0],1);
        this.dim[1] = Math.max(this.dim[1],1);
        this.dim[2] = Math.max(this.dim[2],1);
        this.dim[3] = Math.max(this.dim[3],1);
        this.w = this.dim[0]*this.dim[2]; // buffer width
        this.h = this.dim[1]*this.dim[3]; // buffer height
        this.textures = [
            new Texture (gl, this.w, this.h),
            new Texture (gl, this.w, this.h)
        ];
        this.intTexture = new Texture (gl, this.w, this.h, gl.UNSIGNED_BYTE);
        this.myFFT = new FFT(gl,this);
    }
    constructor (gl, name, dim) {
        this.gl = gl;
        this.name = name; 
        this.dim = dim.concat(); // 4D dimensions
        this.dim[0] = Math.max(this.dim[0],1);
        this.dim[1] = Math.max(this.dim[1],1);
        this.dim[2] = Math.max(this.dim[2],1);
        this.dim[3] = Math.max(this.dim[3],1);
        this.w = this.dim[0]*this.dim[2]; // buffer width
        this.h = this.dim[1]*this.dim[3]; // buffer height
        this.current = 0;
        this.textures = [
            new Texture (gl, this.w, this.h),
            new Texture (gl, this.w, this.h)
        ];
        this.mouse = [0,0,0,0];
        this.intTexture = new Texture (gl, this.w, this.h, gl.UNSIGNED_BYTE);
        let fs = `rgba.xyz*=rgba.w;`;
        fs = `rgba = LOOKUP(tx_`+this.name+`,U_);`+fs;
        fs = fragment_shader([{name:'rgba'}],[this],fs);
        this.myFFT = new FFT(gl,this);
        this.display_program = createProgram (gl, vertex_shader(), fs);
    }
}
class Shader {
    draw (ins=this.ins, outs=this.outs, clear=this.clear, mesh=this.mesh) {
        let gl = this.gl;
        this.vertStart = gl.vertices[mesh+'_start'];
        this.vertEnd = gl.vertices[mesh+'_end'];
        this.drawType = gl.vertices[mesh+'_type'];
        for (let name in this.uniforms) setUni(gl, this.program, 'u_'+name, this.uniforms[name]);
        setUni(gl, this.program, 'R_', [outs[0].w,outs[0].h]);
        setUni(gl, this.program, 'R4_', outs[0].dim);
        for (let i = 0; i < this.ins.length; i++) {
            setUni(gl, this.program, 'tx_'+this.ins[i].name, ins[i].texture,i+outs.length);
            setUni(gl, this.program, 'R_'+this.ins[i].name, [ins[i].w,ins[i].h]);
            setUni(gl, this.program, 'R4_'+this.ins[i].name,ins[i].dim);
        }
        for (let i = 0; i < outs.length; i++) {
            for (let j = 0; j < ins.length; j++) 
                if (ins[j] === outs[i]) 
                    outs[i].next();
            this.framebuffer.textures[i] = outs[i].texture;
        }

        draw (gl, this.program, this.framebuffer, this.vertStart, this.vertEnd, clear, this.drawType);
        return outs;
    }
    reload () {
        let textures = new Array(this.outs.length);
        for (let i = 0; i < textures.length; i++) textures[i] = this.outs[i].texture;
        this.framebuffer = new Framebuffer (this.gl, textures);
    }
    recompile (vs,fs,amendments='') {
        this.vs = vertex_shader(this.outs,this.ins,vs,this.iterator,this.uniforms,amendments);
        this.fs = fragment_shader(this.outs,this.ins,fs,this.iterator,this.uniforms,amendments);
        this.program = createProgram(this.gl, this.vs, this.fs);
    }
    constructor (gl, vs, fs, ins, outs, iterator='U4_', uniforms={}, amendments='', mesh='sqr',clear=true) {
        this.gl = gl;
        this.copyIn = [];
        this.copyOut = [];
        this.ins = ins;
        this.uniforms = uniforms;
        this.outs = outs;
        this.iterator = iterator;
        this.mesh = mesh;
        this.vertStart = gl.vertices[mesh+'_start'];
        this.vertEnd = gl.vertices[mesh+'_end'];
        this.drawType = gl.vertices[mesh+'_type'];
        this.clear = clear;
        this.dim = outs[0].dim;
        this.w = outs[0].w;
        this.h = outs[0].h;
        this.height = this.h;
        this.width = this.w;
        this.vs = vertex_shader(outs,ins,vs,iterator,uniforms,amendments);
        this.fs = fragment_shader(outs,ins,fs,iterator,uniforms,amendments);
        this.program = createProgram(gl, this.vs, this.fs);
        let textures = new Array(outs.length);
        for (let i = 0; i < textures.length; i++) textures[i] = outs[i].texture;
        this.framebuffer = new Framebuffer (gl, textures);
    }
}