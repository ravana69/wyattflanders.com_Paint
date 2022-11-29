window.onload = () => {
	const canvas_gl = document.getElementById('canvas_gl');
	const canvas_2d = document.getElementById('canvas_2d');
	const gl = get_gl(canvas_gl);
	const ctx = get_ctx(canvas_2d,gl);
	const mouse = new Mouse ();
	let ui = ctx.ui;
	let project = new Project (gl,ctx);
	let textbox = new Element(.025*ctx.h,.025*ctx.h,ctx.w-.05*ctx.h,ctx.h-.05*ctx.h);
	ui.selection = textbox;
	ui.free = false;
	textbox.active = true;
/*
	
*/
const file =  
`
$

$
u R = {800,900}
u mouse = {0,0,0,0}
v Q : R
v C : R
v P : R
v S : R

s force :
	in {Q,P}
	    Q = get_Q(U);
	    vec4 dQ = vec4(0);
	    vec4 P = get_P(U);
	    for (int x=-1;x<=1;x++)
		for (int y=-1;y<=1;y++)
		if(abs(x)!=abs(y))
	    {
	        vec4 u = vec(x,y);
	        vec4 a = get_Q(U+u);
	        vec4 p = get_P(U+u);
	        float f = 0.04*(a.w*(a.w-1.))-.01*(p.w-P.w)-.001*hash42(U.xy+u.xy).x;
	        dQ.xy -= f*u.xy;
	    }
	    Q += dQ;
	    if (length(Q.xy)>.5) Q.xy = .5*normalize(Q.xy);
	    
	out {Q}
s advect :
	in {Q,C}
		Q = get_Q(U);
		C = get_C(U);
    	vec4 dQ = vec4(0), dC = vec4(0);
    	for (int x=-1;x<=1;x++)
		for (int y=-1;y<=1;y++)
		if(abs(x)!=abs(y))
	    {
	        vec4 u = vec(x,y);
	        vec4 q = get_Q(U+u);
	        vec4 c = get_C(U+u);
	        vec2 a = Q.xy,
	             b = q.xy+u.xy;
	       float ab = dot(u.xy,b-a);
	       float i = dot(u.xy,(0.5*u.xy-a))/ab;
		    {
		        float d =  8.*Q.w*q.w*Q.w*q.w;
		        float j = .5+.5*clamp(1.-d,0.,1.);
		        float k = .5+.5*clamp(1.-d,0.,1.);
		        float wa = 0.25*Q.w*min(i,j)/j;
		        float wb = 0.25*q.w*max(k+i-1.,0.)/k;
		       	dQ.xyz += Q.xyz*wa+q.xyz*wb;
	       		dQ.w   += wa+wb;
	       		//dC += C*wa+c*wb;
	       	}
	       	{
		        float j = .5;
		        float k = .5;
		        float wa = 0.25*Q.w*min(i,j)/j;
		        float wb = 0.25*q.w*max(k+i-1.,0.)/k;
		       	dC += C*wa+c*wb;
		    }
	    }
	    if (dQ.w>0.)dQ.xyz/=dQ.w;
	    if (dC.w>0.)dC/=dQ.w;
	    Q = dQ;
	    C = dC;
	out {Q,C}
s bound :
	in  {Q,C,P}
		Q = get_Q(U);
		C = get_C(U);
		P = get_P(U);
		float n = get_P(U+vec(0,1)).w;
		float e = get_P(U+vec(1,0)).w;
		float s = get_P(U-vec(0,1)).w;
		float w = get_P(U-vec(1,0)).w;
		float m = .25*(n+e+s+w);
		P.w += .01*(m-P.w)*Q.w;
		if (mouse.z>0.&&length(U.xy-R*mouse.xy)<100.){
	    	float dQ = 1.7;
	    	vec4 dC = max(.5+.5*sin(.01*time+vec4(1,2,3,4)),0.);
	    	float w = exp(-.2*length(U.xy-R*mouse.xy));
	    	Q.w = mix(Q.w,dQ,w);
	    	C = mix(C,dC,w);
	    }
	    float dQ = .0001*Q.w*exp(-Q.w);

	    if (P.w+dQ>0.) P.xyz = (P.xyz*P.w + C.xyz * dQ)/(P.w+dQ);
	    P.w += dQ;
	    Q.w -= dQ;
	    Q.xy *= 1.-exp(-10.*Q.w);
	    //Q.y -= 5e-4;
	    if (length(Q.xy)>.5) Q.xy = .5*normalize(Q.xy);
	out {Q,C,P}
s scene :
	in  {Q,C,P}
		vec4 Q = get_Q(U);
		vec4 C = get_C(U);
		vec4 P = get_P(U);
		float n = -get_Q(U+vec(0,1)).w+get_P(U+vec(0,1)).w-.1*hash42(U.xy+vec2(0,1)).x;
		float e = -get_Q(U+vec(1,0)).w+get_P(U+vec(1,0)).w-.1*hash42(U.xy+vec2(1,0)).x;
		float s = -get_Q(U-vec(0,1)).w+get_P(U-vec(0,1)).w-.1*hash42(U.xy-vec2(0,1)).x;
		float w = -get_Q(U-vec(1,0)).w+get_P(U-vec(1,0)).w-.1*hash42(U.xy-vec2(1,0)).x;
		vec2 g = vec2(e-w,n-s);
		vec4 nor = normalize(vec4(g,1,0));
		S = 1.-Q.w*C-P*max(P.w,.5);
		vec4 light = vec4(R,.1*R.x,0);
		vec4 pos = vec4(U.xy,.1*R.x*P.w,0);
		float ll = 1e-6*line(light,pos,pos+nor);
		S *= exp(-ll)*(.5+dot(normalize(light-pos),nor));
		
		S.w = 1.;
	out {S}

animate :
	js project.uniforms.mouse = project.vectors.S.mouse;
	repeat 8:
		draw force
		draw advect
		draw bound
	draw scene
`;
	project.fromText(file);
textbox.selection = ``;
textbox.selection = new Display (project.vectors.S);
textbox.selection = `
...
`;

	const animate = () => {
		requestAnimationFrame(animate);
		if (window.innerWidth*ctx.dpr!==ctx.canvas.width||
			window.innerHeight*ctx.dpr!==ctx.canvas.height)
		{
			textbox.x = .025*ctx.h;
			textbox.y = .025*ctx.h;
			textbox.w = ctx.w-.05*ctx.h;
			textbox.h = ctx.h-.05*ctx.h;
		}
		ctx.resetTransform();
		ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
		ui.draw(ctx,mouse);
	}
	animate();
	
}