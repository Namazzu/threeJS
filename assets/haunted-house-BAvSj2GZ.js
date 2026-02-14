import{G as _e}from"./lil-gui.esm-hsJpI9MV.js";import{M as c,S as Me,B as Se,U as be,a as J,V as ne,T as xe,b as g,R as a,c as ye,G as se,d as _,C as ke,P as ie,e as Te,A as Pe,D as Ee,f as I,g as Re,W as ze,h as Ce,F as Ae}from"./three.module-xwh0Cw1C.js";import{O as Be,T as Le}from"./OrbitControls-DvPvu61S.js";class O extends c{constructor(){const e=O.SkyShader,N=new Me({name:e.name,uniforms:be.clone(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:Se,depthWrite:!1});super(new J(1,1,1),N),this.isSky=!0}}O.SkyShader={name:"SkyShader",uniforms:{turbidity:{value:2},rayleigh:{value:1},mieCoefficient:{value:.005},mieDirectionalG:{value:.8},sunPosition:{value:new ne},up:{value:new ne(0,1,0)}},vertexShader:`
		uniform vec3 sunPosition;
		uniform float rayleigh;
		uniform float turbidity;
		uniform float mieCoefficient;
		uniform vec3 up;

		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		// constants for atmospheric scattering
		const float e = 2.71828182845904523536028747135266249775724709369995957;
		const float pi = 3.141592653589793238462643383279502884197169;

		// wavelength of used primaries, according to preetham
		const vec3 lambda = vec3( 680E-9, 550E-9, 450E-9 );
		// this pre-calculation replaces older TotalRayleigh(vec3 lambda) function:
		// (8.0 * pow(pi, 3.0) * pow(pow(n, 2.0) - 1.0, 2.0) * (6.0 + 3.0 * pn)) / (3.0 * N * pow(lambda, vec3(4.0)) * (6.0 - 7.0 * pn))
		const vec3 totalRayleigh = vec3( 5.804542996261093E-6, 1.3562911419845635E-5, 3.0265902468824876E-5 );

		// mie stuff
		// K coefficient for the primaries
		const float v = 4.0;
		const vec3 K = vec3( 0.686, 0.678, 0.666 );
		// MieConst = pi * pow( ( 2.0 * pi ) / lambda, vec3( v - 2.0 ) ) * K
		const vec3 MieConst = vec3( 1.8399918514433978E14, 2.7798023919660528E14, 4.0790479543861094E14 );

		// earth shadow hack
		// cutoffAngle = pi / 1.95;
		const float cutoffAngle = 1.6110731556870734;
		const float steepness = 1.5;
		const float EE = 1000.0;

		float sunIntensity( float zenithAngleCos ) {
			zenithAngleCos = clamp( zenithAngleCos, -1.0, 1.0 );
			return EE * max( 0.0, 1.0 - pow( e, -( ( cutoffAngle - acos( zenithAngleCos ) ) / steepness ) ) );
		}

		vec3 totalMie( float T ) {
			float c = ( 0.2 * T ) * 10E-18;
			return 0.434 * c * MieConst;
		}

		void main() {

			vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
			vWorldPosition = worldPosition.xyz;

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			gl_Position.z = gl_Position.w; // set z to camera.far

			vSunDirection = normalize( sunPosition );

			vSunE = sunIntensity( dot( vSunDirection, up ) );

			vSunfade = 1.0 - clamp( 1.0 - exp( ( sunPosition.y / 450000.0 ) ), 0.0, 1.0 );

			float rayleighCoefficient = rayleigh - ( 1.0 * ( 1.0 - vSunfade ) );

			// extinction (absorption + out scattering)
			// rayleigh coefficients
			vBetaR = totalRayleigh * rayleighCoefficient;

			// mie coefficients
			vBetaM = totalMie( turbidity ) * mieCoefficient;

		}`,fragmentShader:`
		varying vec3 vWorldPosition;
		varying vec3 vSunDirection;
		varying float vSunfade;
		varying vec3 vBetaR;
		varying vec3 vBetaM;
		varying float vSunE;

		uniform float mieDirectionalG;
		uniform vec3 up;

		// constants for atmospheric scattering
		const float pi = 3.141592653589793238462643383279502884197169;

		const float n = 1.0003; // refractive index of air
		const float N = 2.545E25; // number of molecules per unit volume for air at 288.15K and 1013mb (sea level -45 celsius)

		// optical length at zenith for molecules
		const float rayleighZenithLength = 8.4E3;
		const float mieZenithLength = 1.25E3;
		// 66 arc seconds -> degrees, and the cosine of that
		const float sunAngularDiameterCos = 0.999956676946448443553574619906976478926848692873900859324;

		// 3.0 / ( 16.0 * pi )
		const float THREE_OVER_SIXTEENPI = 0.05968310365946075;
		// 1.0 / ( 4.0 * pi )
		const float ONE_OVER_FOURPI = 0.07957747154594767;

		float rayleighPhase( float cosTheta ) {
			return THREE_OVER_SIXTEENPI * ( 1.0 + pow( cosTheta, 2.0 ) );
		}

		float hgPhase( float cosTheta, float g ) {
			float g2 = pow( g, 2.0 );
			float inverse = 1.0 / pow( 1.0 - 2.0 * g * cosTheta + g2, 1.5 );
			return ONE_OVER_FOURPI * ( ( 1.0 - g2 ) * inverse );
		}

		void main() {

			vec3 direction = normalize( vWorldPosition - cameraPosition );

			// optical length
			// cutoff angle at 90 to avoid singularity in next formula.
			float zenithAngle = acos( max( 0.0, dot( up, direction ) ) );
			float inverse = 1.0 / ( cos( zenithAngle ) + 0.15 * pow( 93.885 - ( ( zenithAngle * 180.0 ) / pi ), -1.253 ) );
			float sR = rayleighZenithLength * inverse;
			float sM = mieZenithLength * inverse;

			// combined extinction factor
			vec3 Fex = exp( -( vBetaR * sR + vBetaM * sM ) );

			// in scattering
			float cosTheta = dot( direction, vSunDirection );

			float rPhase = rayleighPhase( cosTheta * 0.5 + 0.5 );
			vec3 betaRTheta = vBetaR * rPhase;

			float mPhase = hgPhase( cosTheta, mieDirectionalG );
			vec3 betaMTheta = vBetaM * mPhase;

			vec3 Lin = pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * ( 1.0 - Fex ), vec3( 1.5 ) );
			Lin *= mix( vec3( 1.0 ), pow( vSunE * ( ( betaRTheta + betaMTheta ) / ( vBetaR + vBetaM ) ) * Fex, vec3( 1.0 / 2.0 ) ), clamp( pow( 1.0 - dot( up, vSunDirection ), 5.0 ), 0.0, 1.0 ) );

			// nightsky
			float theta = acos( direction.y ); // elevation --> y-axis, [-pi/2, pi/2]
			float phi = atan( direction.z, direction.x ); // azimuth --> x-axis [-pi/2, pi/2]
			vec2 uv = vec2( phi, theta ) / vec2( 2.0 * pi, pi ) + vec2( 0.5, 0.0 );
			vec3 L0 = vec3( 0.1 ) * Fex;

			// composition + solar disc
			float sundisk = smoothstep( sunAngularDiameterCos, sunAngularDiameterCos + 0.00002, cosTheta );
			L0 += ( vSunE * 19000.0 * Fex ) * sundisk;

			vec3 texColor = ( Lin + L0 ) * 0.04 + vec3( 0.0, 0.0003, 0.00075 );

			vec3 retColor = pow( texColor, vec3( 1.0 / ( 1.2 + ( 1.2 * vSunfade ) ) ) );

			gl_FragColor = vec4( retColor, 1.0 );

			#include <tonemapping_fragment>
			#include <colorspace_fragment>

		}`};function Ie(Q){const e=new xe,N=e.load("./floor/alpha.webp"),M=e.load("./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp"),w=e.load("./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp"),T=e.load("./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp"),P=e.load("./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp");M.colorSpace=g,M.repeat.set(8,8),w.repeat.set(8,8),T.repeat.set(8,8),P.repeat.set(8,8),M.wrapS=a,w.wrapS=a,T.wrapS=a,P.wrapS=a,M.wrapT=a,w.wrapT=a,T.wrapT=a,P.wrapT=a;const Y=e.load("./wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp"),W=e.load("./wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp"),re=e.load("./wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp");Y.colorSpace=g;const E=e.load("./roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp"),S=e.load("./roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp"),V=e.load("./roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp");E.colorSpace=g,E.repeat.set(3,1),S.repeat.set(3,1),V.repeat.set(3,1),E.wrapS=a,S.wrapS=a,V.wrapS=a;const R=e.load("./bush/leaves_forest_ground_1k/leaves_forest_ground_diff_1k.webp"),b=e.load("./bush/leaves_forest_ground_1k/leaves_forest_ground_arm_1k.webp"),H=e.load("./bush/leaves_forest_ground_1k/leaves_forest_ground_nor_gl_1k.webp");R.colorSpace=g,R.repeat.set(3,1),b.repeat.set(3,1),H.repeat.set(3,1),R.wrapS=a,b.wrapS=a,H.wrapS=a;const z=e.load("./grave/plastered_stone_wall_1k/plastered_stone_wall_diff_1k.webp"),x=e.load("./grave/plastered_stone_wall_1k/plastered_stone_wall_arm_1k.webp"),U=e.load("./grave/plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.webp");z.colorSpace=g,z.repeat.set(.3,.4),x.repeat.set(.3,.4),U.repeat.set(.3,.4),z.wrapS=a,x.wrapS=a,U.wrapS=a;const $=e.load("./door/color.webp"),le=e.load("./door/alpha.webp"),ce=e.load("./door/ambientOcclusion.webp"),de=e.load("./door/height.webp"),pe=e.load("./door/normal.webp"),he=e.load("./door/metalness.webp"),fe=e.load("./door/roughness.webp");$.colorSpace=g;const K=new _e,n=new ye,v=new se;n.add(v);const y=new c(new J(4,2.5,4),new _({map:Y,aoMap:W,roughnessMap:W,metalnessMap:W,normalMap:re}));y.position.y+=y.geometry.parameters.height/2,v.add(y);const C=new c(new ke(3.5,1.5,4),new _({map:E,aoMap:S,roughnessMap:S,metalnessMap:S,normalMap:V}));C.position.y+=2.5+.75,C.rotation.y=Math.PI*.25,v.add(C);const Z=new c(new ie(2.2,2.2,100,100),new _({map:$,transparent:!0,alphaMap:le,aoMap:ce,displacementMap:de,displacementScale:.15,displacementBias:-.04,normalMap:pe,metalnessMap:he,roughnessMap:fe}));Z.position.z=2+.01,Z.position.y=1,v.add(Z);const A=new Te(1,16,16),B=new _({color:"#ccffcc",map:R,aoMap:b,roughnessMap:b,metalnessMap:b,normalMap:H}),L=new c(A,B);L.scale.set(.5,.5,.5),L.position.set(.8,.2,2.2),L.rotation.x=-.75;const D=new c(A,B);D.scale.set(.25,.25,.25),D.position.set(1.4,.1,2.1),D.rotation.x=-.75;const G=new c(A,B);G.scale.set(.4,.4,.4),G.position.set(-.8,.1,2.2),G.rotation.x=-.75;const F=new c(A,B);F.scale.set(.15,.15,.15),F.position.set(-1,.05,2.6),F.rotation.x=-.75,v.add(L,D,G,F);const me=new J(.6,.8,.2),ue=new _({map:z,aoMap:x,roughnessMap:x,metalnessMap:x,normalMap:U}),j=new se;n.add(j);for(let r=0;r<30;r++){const t=Math.random()*Math.PI*2,l=3+Math.random()*4,o=new c(me,ue),ve=Math.sin(t)*l,ge=Math.cos(t)*l;o.position.x=ve,o.position.z=ge,o.position.y=Math.random()*.4,o.rotation.x=(Math.random()-.5)*.4,o.rotation.y=(Math.random()-.5)*.4,o.rotation.z=(Math.random()-.5)*.4,j.add(o)}const k=new c(new ie(20,20,100,100),new _({alphaMap:N,transparent:!0,map:M,aoMap:w,roughnessMap:w,metalnessMap:w,normalMap:T,displacementMap:P,displacementScale:.3,displacementBias:-.2}));k.rotation.x=-Math.PI*.5,n.add(k),K.add(k.material,"displacementScale").min(0).max(1).step(.001).name("floorDisplacementScale"),K.add(k.material,"displacementBias").min(-1).max(1).step(.001).name("floorDisplacementBias");const we=new Pe("#86cdff",.275);n.add(we);const s=new Ee("#86cdff",1);s.position.set(3,2,-8),n.add(s);const ee=new I("#ff7d46",5);ee.position.set(0,2.2,2.5),v.add(ee);const d=new I("#8800ff",6),p=new I("#ff0088",6),h=new I("#ff0000",6);n.add(d,p,h);const i={width:window.innerWidth,height:window.innerHeight},oe=()=>{i.width=window.innerWidth,i.height=window.innerHeight,f.aspect=i.width/i.height,f.updateProjectionMatrix(),m.setSize(i.width,i.height),m.setPixelRatio(Math.min(window.devicePixelRatio,2))};window.addEventListener("resize",oe);const f=new Re(75,i.width/i.height,.1,100);f.position.x=4,f.position.y=2,f.position.z=5,n.add(f);const X=new Be(f,Q);X.maxPolarAngle=Math.PI/2.1,X.enableDamping=!0;const m=new ze({canvas:Q});m.setSize(i.width,i.height),m.setPixelRatio(Math.min(window.devicePixelRatio,2)),m.shadowMap.enabled=!0,m.shadowMap.type=Ce,s.castShadow=!0,d.castShadow=!0,p.castShadow=!0,h.castShadow=!0,y.castShadow=!0,y.receiveShadow=!0,C.castShadow=!0,k.receiveShadow=!0;for(const r of j.children)r.castShadow=!0,r.receiveShadow=!0;s.shadow.mapSize.width=256,s.shadow.mapSize.height=256,s.shadow.camera.top=8,s.shadow.camera.right=8,s.shadow.camera.bottom=-8,s.shadow.camera.left=-8,s.shadow.camera.near=1,s.shadow.camera.far=20,d.shadow.mapSize.width=256,d.shadow.mapSize.height=256,d.shadow.camera.far=10,p.shadow.mapSize.width=256,p.shadow.mapSize.height=256,p.shadow.camera.far=10,h.shadow.mapSize.width=256,h.shadow.mapSize.height=256,h.shadow.camera.far=10;const u=new O;u.scale.set(100,100,100),u.material.uniforms.turbidity.value=10,u.material.uniforms.rayleigh.value=3,u.material.uniforms.mieCoefficient.value=.1,u.material.uniforms.mieDirectionalG.value=.95,u.material.uniforms.sunPosition.value.set(.3,-.038,-.95),n.add(u),n.fog=new Ae("#02343f",.1);const ae=new Le;let q=null;const te=()=>{ae.update();const r=ae.getElapsed(),t=r*.5;d.position.x=Math.cos(t)*4,d.position.z=Math.sin(t)*4,d.position.y=Math.sin(t)*Math.sin(t*2.34)*Math.sin(t*3.45);const l=-r*.38;p.position.x=Math.cos(l)*5,p.position.z=Math.sin(l)*5,p.position.y=Math.sin(l)*Math.sin(l*2.34)*Math.sin(l*3.45);const o=r*.23;h.position.x=Math.cos(o)*6,h.position.z=Math.sin(o)*6,h.position.y=Math.sin(o)*Math.sin(o*2.34)*Math.sin(o*3.45),X.update(),m.render(n,f),q=window.requestAnimationFrame(te)};return te(),function(){q&&window.cancelAnimationFrame(q),window.removeEventListener("resize",oe),K.destroy(),m.dispose(),n.traverse(t=>{if(t.isMesh&&(t.geometry.dispose(),t.material.isMaterial)){for(const l of Object.keys(t.material)){const o=t.material[l];o&&typeof o.dispose=="function"&&o.dispose()}t.material.dispose()}})}}export{Ie as default};
//# sourceMappingURL=haunted-house-BAvSj2GZ.js.map
