HEIGHT_MAP = "assets/island-height-map-1024.png";

var vertexShader = [
    "uniform sampler2D heightMapTexture;",
    "uniform float heightScale;",
    "",
    "varying float vAmount;",
    "varying vec2 vUV;",
    "varying vec3 vPos;",
    "varying vec3 vNormal;",
    //THREE.ShaderChunk["common"],
    //THREE.ShaderChunk['worldpos_vertex'],
    //THREE.ShaderChunk["shadowmap_pars_vertex"],
    "",
    "void main()",
    "{",
    "    vPos = (modelMatrix * vec4(position, 1.0)).xyz;",
    "    vNormal = normalMatrix * normal;",
    "    vUV = uv;",
    "    vec4 heightData = texture2D( heightMapTexture, uv );",
    "",
    "    vAmount = heightData.r; // assuming map is grayscale it doesn't matter if you use r, g, or b.",
    "",
    "    // move the position along the normal",
    "    vec3 newPosition = position + normal * heightScale * vAmount;",
    "",
    "    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",
    //THREE.ShaderChunk["shadowmap_vertex"],
    "}"
].join("\n");

var fragmentShader = [
    "uniform vec3 diffuse;",
    "uniform vec3 directionalLightColor[MAX_DIR_LIGHTS];",
    "uniform vec3 directionalLightPosition[MAX_DIR_LIGHTS];",
    "uniform float directionalLightDistance[MAX_DIR_LIGHTS];",
    "uniform sampler2D sandyTexture;",
    "uniform sampler2D forestTexture;",
    "uniform sampler2D rockyTexture;",
    //THREE.ShaderChunk["common"],
    //THREE.ShaderChunk["shadowmap_pars_fragment"],
    "",
    "varying vec3 vPos;",
    "varying vec3 vNormal;",
    "varying float vAmount;",
    "varying vec2 vUV;",
    "",
    "void main()",
    "{",
    //"	vec3 outgoingLight = vec3( 0.0 );",	// outgoing light does not have an alpha, the surface does
    //"   vec4 addedLights = vec4(0.0, 0.0, 0.0, 1.0);",
    //"   for(int l = 0; l < MAX_DIR_LIGHTS; l++) {",
    //"       vec3 lightDirection = normalize(vPos - directionalLightPosition[l]);",
    //"       addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * directionalLightColor[l];",
    //"   }",
    //"",
    //THREE.ShaderChunk["shadowmap_fragment"],
    //"",
    //"   gl_FragColor = mix(vec4(diffuse.x, diffuse.y, diffuse.z, 1.0), addedLights, addedLights);",
    "   vec4 sandy = (smoothstep(0.00, 0.00, vAmount) - smoothstep(0.03, 0.05, vAmount)) * texture2D( sandyTexture, vUV * 128.0 );",
    "   vec4 forest = (smoothstep(0.03, 0.05, vAmount) - smoothstep(0.25, 0.30, vAmount)) * texture2D( forestTexture, vUV * 16.0 );",
    "   vec4 rocky = (smoothstep(0.20, 0.40, vAmount))                                   * texture2D( rockyTexture, vUV * 32.0 );",
    "   gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0) + sandy + forest + rocky; //, 1.0);",
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

        $('#WebGL-output').append(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);

        this.clock = new THREE.Clock();

        this.stats = this.initStats();

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 3000000);
        this.camX = 0;
        this.camera.position.set(0, 500, 2000);
        this.camera.lookAt(project.scene.position);
        this.scene.add(this.camera);

        this.controls = new THREE.FlyControls(this.camera);
        this.controls.movementSpeed = 100;
        this.controls.domElement = this.renderer.domElement;
        this.controls.rollSpeed = new THREE.Vector3(0.5 * Math.PI / 24, 0.5 * Math.PI / 24, 2 * Math.PI / 24);
        this.controls.autoForward = true;
        this.controls.dragToLook = true;

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
        //this.directionalLight.shadowCameraVisible = true;
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
        spotLight0.angle = Math.PI / 2;
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

        this.loadModel();
    },

    loadTerrain: function () {
        // terrain
        var img = new Image();
        img.onload = function () {
            var data = project.getHeightData(img, 0.2);

            var geometry = new THREE.PlaneBufferGeometry(10000, 10000, 269, 269);
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
        var heightMapTexture = new THREE.ImageUtils.loadTexture(HEIGHT_MAP);
        heightMapTexture.wrapS = heightMapTexture.wrapT = THREE.RepeatWrapping;
        // magnitude of normal displacement
        var heightScale = 640.0;

        //var anisotropy = project.renderer.getMaxAnisotropy();
        var anisotropy = 1;

        var sandyTexture = new THREE.ImageUtils.loadTexture('assets/img/sand2-512.jpg');
        sandyTexture.wrapS = sandyTexture.wrapT = THREE.RepeatWrapping;
        sandyTexture.anisotropy = anisotropy;

        var forestTexture = new THREE.ImageUtils.loadTexture('assets/img/forest2-2048.jpg');
        forestTexture.wrapS = forestTexture.wrapT = THREE.RepeatWrapping;
        forestTexture.anisotropy = anisotropy;

        var rockyTexture = new THREE.ImageUtils.loadTexture('assets/img/rock-512.jpg');
        rockyTexture.wrapS = rockyTexture.wrapT = THREE.RepeatWrapping;
        rockyTexture.anisotropy = anisotropy;

        // use "this." to create global object
        var customUniforms = THREE.UniformsUtils.merge([
                THREE.UniformsLib['lights'],
                THREE.UniformsLib["shadowmap"],
                {
                    heightScale: {type: "f", value: heightScale},
                    diffuse: {type: 'c', value: new THREE.Color(0x00ff00)}
                }
            ]
        );

        customUniforms.heightMapTexture = {type: "t", value: heightMapTexture};
        customUniforms.sandyTexture = {type: "t", value: sandyTexture};
        customUniforms.forestTexture = {type: "t", value: forestTexture};
        customUniforms.rockyTexture = {type: "t", value: rockyTexture};

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

        var planeGeo = new THREE.PlaneBufferGeometry(10000, 10000, 300, 300);
        var plane = new THREE.Mesh(planeGeo, customMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -5;
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

    initStats: function () {

        var stats = new Stats();

        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';

        $("#Stats-output").append(stats.domElement);

        return stats;
    },

    loadModel: function () {
        var manager = new THREE.LoadingManager();
        manager.onProgress = function (item, loaded, total) {

            console.log(item, loaded, total);

        };

        var onProgress = function (xhr) {
            if (xhr.lengthComputable) {
                var percentComplete = xhr.loaded / xhr.total * 100;
                console.log(Math.round(percentComplete) + '% downloaded');
            }
        };

        var onError = function (xhr) {
            console.log("error in loading file");
        };


        var loader = new THREE.OBJLoader(manager);
        loader.load('assets/airplane/a380.obj', function (object) {

            object.traverse(function (child) {

                if (child instanceof THREE.Mesh) {

                    child.material = new THREE.MeshLambertMaterial({
                        color: 0xffffff,
                        side: THREE.DoubleSide
                    });
                    child.scale.set(0.01, 0.01, 0.01);

                }

            });

            object.position.y = -20;
            object.position.z = -90;
            var mat = new THREE.Matrix4();
            mat.makeScale(0.000001, 0.000001, 0.000001);
            object.scale = mat;
            project.camera.add(object);

        }, onProgress, onError);
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
        var deltaTime = project.clock.getDelta();

        this.stats.update();

        //this.camX += 0.6;
        //this.camera.position.set(this.camX, 500, 500);
        //this.camera.lookAt(project.scene.position);

        this.controls.update(deltaTime);

        this.ms_Water.render();
        this.renderer.render(this.scene, this.camera);
    },

    update: function update() {
        this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;
    }
};
