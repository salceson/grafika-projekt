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
        this.previousPosition = new THREE.Vector3(0, 0, 0);

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
        this.camera.position.set(-1000, 300, -1000);
        this.camera.lookAt(project.scene.position);
        this.scene.add(this.camera);

        this.controls = new THREE.FlyControls(this.camera);
        this.controls.movementSpeed = 100;
        this.controls.domElement = this.renderer.domElement;
        this.controls.rollSpeed = new THREE.Vector3(0.5 * Math.PI / 24, 0.2 * Math.PI / 24, 2 * Math.PI / 24);
        this.controls.autoForward = true;
        this.controls.dragToLook = true;

        var hemiLight = new THREE.HemisphereLight( 0xEEEEFF, 0x000000, 0.9 );
        hemiLight.position.set( 0, 500, 0 );
        //hemiLight.castShadow = true;
        this.scene.add( hemiLight );

        this.directionalLight = new THREE.DirectionalLight(0xffffcc, 0.6);
        this.directionalLight.position.set(-600, 400, 0);
        //this.directionalLight.target.position.set(0, 0, 0);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadowCameraNear = -100;
        this.directionalLight.shadowCameraFar = 100;
        this.directionalLight.shadowCameraLeft = -100;
        this.directionalLight.shadowCameraRight = 100;
        this.directionalLight.shadowCameraTop = 100;
        this.directionalLight.shadowCameraBottom = -100;
        //this.directionalLight.shadowCameraVisible = true;
        this.directionalLight.shadowMapWidth = 2048;
        this.directionalLight.shadowMapHeight = 2048;
        this.directionalLight.shadowDarkness = 0.3;
        this.scene.add(this.directionalLight);

        this.dirLightHelper = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1, 1, 1, 1),
            new THREE.MeshNormalMaterial({transparent: true, opacity: 0})
        );
        this.dirLightHelper.position.set(0, 0, 0);
        this.directionalLight.target = this.dirLightHelper;
        this.scene.add(this.dirLightHelper);

        this.loadSkyBox();

        this.worldSize = 10240;
        this.heightScale = 640;
        this.worldElevation = -5;

        this.loadShaderTerrain();
        //this.loadTerrain();

        this.loadWater();

        this.loadModel();

        var img = new Image();
        img.onload = function () {
            project.heightData = project.getHeightData(img, project.heightScale / 256);
        };
        img.src = HEIGHT_MAP;
        //this.mapScale = 37.9259259;
        this.mapScale = 10.0;
    },

    loadTerrain: function () {
        // terrain
        var img = new Image();
        img.onload = function () {
            var data = project.getHeightData(img, project.heightScale / 256);

            var geometry = new THREE.PlaneGeometry(project.worldSize, project.worldSize, 269, 269);
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
        var heightScale = project.heightScale;

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

        var planeGeo = new THREE.PlaneBufferGeometry(project.worldSize, project.worldSize, 300, 300);
        var plane = new THREE.Mesh(planeGeo, customMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = project.worldElevation;
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
            data[j++] = all * scale / 3;
        }

        return data;
    },

    getHeightAtPoint: function(x, y) {
        if(project.heightData == undefined || Math.abs(x) >= project.worldSize/2 || Math.abs(y) >= project.worldSize/2) {
            return project.worldElevation;
        }

        var width = Math.sqrt(project.heightData.length);

        var xpos = Math.round((x + project.worldSize/2) / project.mapScale);
        var ypos = Math.round((y + project.worldSize/2) / project.mapScale);

        return project.heightData[ypos * width + xpos] + project.worldElevation;
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
            sunDirection: new THREE.Vector3(0, 0, 0).copy(project.directionalLight.position.normalize()),
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

                    child.material = new THREE.MeshPhongMaterial({
                        color: 0xffffff,
                        side: THREE.DoubleSide
                    });
                    child.receiveShadow = true;
                    child.castShadow = true;
                    child.scale.set(0.01, 0.01, 0.01);

                }

            });

            object.position.y = -20;
            object.position.z = -90;
            var mat = new THREE.Matrix4();
            mat.makeScale(0.000001, 0.000001, 0.000001);
            object.scale = mat;
            project.camera.add(object);
            project.aircraftModel = object;

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
        this.ms_Water.render();
        this.renderer.render(this.scene, this.camera);
    },

    update: function update() {
        if(project.aircraftModel) {
            var aircraftPos = new THREE.Vector3().copy(project.aircraftModel.position);
            aircraftPos.applyProjection(project.camera.matrixWorld);
            var terrHeight = project.getHeightAtPoint(aircraftPos.x, aircraftPos.z);
            var aircraftHeight = aircraftPos.y;
        }

        var deltaTime = project.clock.getDelta();

        this.stats.update();

        if(project.aircraftModel && aircraftHeight > terrHeight) {
            this.controls.update(deltaTime);
        }

        var newPosition = this.camera.position;
        var minusPreviousPosition = new THREE.Vector3(0, 0, 0).copy(this.previousPosition).multiplyScalar(-1);
        var delta = new THREE.Vector3(0, 0, 0).copy(newPosition).add(minusPreviousPosition);
        var dirPos = new THREE.Vector3(0, 0, 0).copy(this.directionalLight.position).add(delta);
        var dirTrgtPos = new THREE.Vector3(0, 0, 0).copy(this.directionalLight.target.position).add(delta);
        this.directionalLight.position.set(dirPos.x, dirPos.y, dirPos.z);
        this.dirLightHelper.position.set(dirTrgtPos.x, dirTrgtPos.y, dirTrgtPos.z);
        this.ms_Water.material.uniforms.time.value += 1.0 / 60.0;
        this.previousPosition = new THREE.Vector3(0, 0, 0).copy(newPosition);
    }
};
