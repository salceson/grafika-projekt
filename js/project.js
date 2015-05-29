HEIGHT_MAP = "assets/island-height-map2.png";

var vertexShader = [
    "uniform sampler2D bumpTexture;",
    "uniform float bumpScale;",
    "",
    "varying float vAmount;",
    "varying vec2 vUV;",
    "varying vec3 vPos;",
    "varying vec3 vNormal;",
    THREE.ShaderChunk[ "common" ],
    THREE.ShaderChunk[ 'worldpos_vertex'],
    THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
    "",
    "void main()",
    "{",
    "    vPos = (modelMatrix * vec4(position, 1.0)).xyz;",
    "    vNormal = normalMatrix * normal;",
    "    vUV = uv;",
    "    vec4 bumpData = texture2D( bumpTexture, uv );",
    "",
    "    vAmount = bumpData.r; // assuming map is grayscale it doesn't matter if you use r, g, or b.",
    "",
    "    // move the position along the normal",
    "    vec3 newPosition = position + normal * bumpScale * vAmount;",
    "",
    "    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",
    THREE.ShaderChunk[ "shadowmap_vertex" ],
    "}"
].join("\n");

var fragmentShader = [
    "uniform vec3 diffuse;",
    "varying vec3 vPos;",
    "varying vec3 vNormal;",
    "uniform vec3 directionalLightColor[MAX_DIR_LIGHTS];",
    "uniform vec3 directionalLightPosition[MAX_DIR_LIGHTS];",
    "uniform float directionalLightDistance[MAX_DIR_LIGHTS];",
    THREE.ShaderChunk[ "common" ],
    THREE.ShaderChunk[ "shadowmap_pars_fragment" ],
    "",
    "void main()",
    "{",
    "	vec3 outgoingLight = vec3( 0.0 );",	// outgoing light does not have an alpha, the surface does
    "   vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);",
    "   for(int l = 0; l < MAX_DIR_LIGHTS; l++) {",
    "       vec3 lightDirection = normalize(vPos - directionalLightPosition[l]);",
    "       addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * directionalLightColor[l];",
    "   }",
    "",
    THREE.ShaderChunk[ "shadowmap_fragment" ],
    "",
    "   gl_FragColor = mix(vec4(diffuse.x, diffuse.y, diffuse.z, 1.0), addedLights, addedLights);",
    "}"
].join("\n");

var project = {
    init: function () {
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMapEnabled = true;
        this.renderer.shadowMapSoft = true;
        this.renderer.autoClear = true;
        this.renderer.autoClearColor = true;

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.5, 3000000);
        this.camX = 0;
        this.camera.position.set(0, 200, 500);
        this.camera.lookAt(project.scene.position);
        this.scene.add(this.camera);

        var hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
        hemiLight.position.set(0, 500, 0);
        hemiLight.castShadow = true;
        //this.scene.add( hemiLight );

        this.directionalLight = new THREE.DirectionalLight(0xffff55, 1);
        this.directionalLight.position.set(-600, 300, 600);
        this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadowCameraNear = -1000;
        this.directionalLight.shadowCameraFar = 500;
        this.directionalLight.shadowCameraLeft = -1000;
        this.directionalLight.shadowCameraRight = 1000;
        this.directionalLight.shadowCameraTop = 1000;
        this.directionalLight.shadowCameraBottom = -1000;
        this.directionalLight.shadowCameraVisible = true;
        this.directionalLight.shadowMapWidth = 2048;
        this.directionalLight.shadowMapHeight = 2048;
        this.scene.add(this.directionalLight);

        //add spotlight for a bit of light
        var spotLight0 = new THREE.SpotLight(0xcccccc);
        spotLight0.position.set(-400, 400, -10);
        spotLight0.lookAt(0, 0, 0);
        spotLight0.castShadow = true;
        spotLight0.shadowMapWidth = 2048;
        spotLight0.shadowMapHeight = 2048;
        spotLight0.angle = Math.PI / 2
        this.scene.add(spotLight0);

        // create a cube
        var cubeGeometry = new THREE.BoxGeometry(100, 100, 100);
        var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff3333});
        var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.castShadow = true;

        // position the cube
        cube.position.x = -4;
        cube.position.y = 200;
        cube.position.z = 0;

        // add the cube to the scene
        this.scene.add(cube);

        this.loadSkyBox();

        this.loadShaderTerrain();
        //this.loadTerrain();

        this.loadWater();
    },

    loadTerrain: function () {
        // terrain
        var img = new Image();
        img.onload = function () {
            var data = project.getHeightData(img, 0.2);

            var geometry = new THREE.PlaneGeometry(10000, 10000, 269, 269);
            var texture = THREE.ImageUtils.loadTexture(HEIGHT_MAP);
            var material = new THREE.MeshLambertMaterial({color: 0x00FF00});
            var plane = new THREE.Mesh(geometry, material);
            plane.rotation.x = -Math.PI / 2;
            plane.position.y = -1;

            //set height of vertices
            for (var i = 0; i < plane.geometry.vertices.length; i++) {
                plane.geometry.vertices[i].z = data[i];
            }

            plane.castShadow = true;
            plane.receiveShadow = true;

            project.scene.add(plane);
        };
        img.src = HEIGHT_MAP;
    },

    loadShaderTerrain: function () {
        // texture used to generate "bumpiness"
        var bumpTexture = new THREE.ImageUtils.loadTexture(HEIGHT_MAP);
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
        // magnitude of normal displacement
        var bumpScale = 512.0;

        // use "this." to create global object
        var customUniforms = THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                THREE.UniformsLib["shadowmap"],
                {
                    bumpTexture: {type: "t", value: bumpTexture},
                    bumpScale: {type: "f", value: bumpScale},
                    diffuse: {type: 'c', value: new THREE.Color(0x00ff00)}
                }
            ]
        );

        customUniforms.bumpTexture = {type: "t", value: bumpTexture};

        // create custom material from the shader code above
        //   that is within specially labelled script tags
        var customMaterial = new THREE.ShaderMaterial(
            {
                uniforms: customUniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                //side: THREE.DoubleSide,
                lights: true
            });

        var planeGeo = new THREE.PlaneGeometry(10000, 10000, 269, 269);
        var plane = new THREE.Mesh(planeGeo, customMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -1;
        plane.receiveShadow = true;
        this.scene.add(plane);
    },

    //return array with height data from img
    getHeightData: function (img, scale) {
        if (scale == undefined) scale = 1;

        var canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        var context = canvas.getContext('2d');

        var size = img.width * img.height;
        var data = new Float32Array(size);

        context.drawImage(img, 0, 0);

        for (var i = 0; i < size; i++) {
            data[i] = 0
        }

        var imgd = context.getImageData(0, 0, img.width, img.height);
        var pix = imgd.data;

        var j = 0;
        for (var i = 0; i < pix.length; i += 4) {
            var all = pix[i] + pix[i + 1] + pix[i + 2];
            data[j++] = all / (12 * scale);
        }

        return data;
    },

    loadSkyBox: function loadSkyBox() {
        var aCubeMap = THREE.ImageUtils.loadTextureCube([
            'assets/img/px.png',
            'assets/img/nx.png',
            'assets/img/py.png',
            'assets/img/ny.png',
            'assets/img/pz.png',
            'assets/img/nz.png'
        ]);
        aCubeMap.format = THREE.RGBFormat;

        var aShader = THREE.ShaderLib['cube'];
        aShader.uniforms['tCube'].value = aCubeMap;

        var aSkyBoxMaterial = new THREE.ShaderMaterial({
            fragmentShader: aShader.fragmentShader,
            vertexShader: aShader.vertexShader,
            uniforms: aShader.uniforms,
            depthWrite: false,
            side: THREE.BackSide
        });

        var aSkybox = new THREE.Mesh(
            new THREE.BoxGeometry(1000000, 1000000, 1000000),
            aSkyBoxMaterial
        );

        this.scene.add(aSkybox);
    },

    loadWater: function () {
        // Load textures
        var waterNormals = new THREE.ImageUtils.loadTexture('assets/img/waternormals.jpg');
        waterNormals.wrapS = waterNormals.wrapT = THREE.RepeatWrapping;

        // Create the water effect
        project.ms_Water = new THREE.Water(project.renderer, project.camera, project.scene, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: waterNormals,
            alpha: 1.0,
            sunDirection: project.directionalLight.position.normalize(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 50.0
        });
        var aMeshMirror = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(2000 * 500, 2000 * 500, 10, 10),
            project.ms_Water.material
        );
        aMeshMirror.add(project.ms_Water);
        aMeshMirror.rotation.x = -Math.PI * 0.5;
        project.scene.add(aMeshMirror);
    },

    onWindowResize: function () {
        project.camera.aspect = window.innerWidth / window.innerHeight;
        project.camera.updateProjectionMatrix();
        project.renderer.setSize(window.innerWidth, window.innerHeight);
    },

    animate: function () {
        requestAnimationFrame(project.animate);
        project.update();
        project.render();
    },

    render: function () {
        this.camX += 0.3;
        this.camera.position.set(this.camX, 500, 1000);
        this.camera.lookAt(project.scene.position);
        this.ms_Water.render();
        this.renderer.render(this.scene, this.camera);
    },

    update: function update() {
        this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;
    }
};
