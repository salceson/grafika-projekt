HEIGHT_MAP = "assets/island-height-map2.png";

var vertexShader = [
    "uniform sampler2D bumpTexture;",
    "uniform float bumpScale;",
    "",
    "varying float vAmount;",
    "varying vec2 vUV;",
    "",
    "void main()",
    "{",
    "    vUV = uv;",
    "    vec4 bumpData = texture2D( bumpTexture, uv );",
    "",
    "    vAmount = bumpData.r; // assuming map is grayscale it doesn't matter if you use r, g, or b.",
    "",
    "    // move the position along the normal",
    "    vec3 newPosition = position + normal * bumpScale * vAmount;",
    "",
    "    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );",
    "}"
].join("\n");

var fragmentShader = "void main() { gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); }";

var project = {
    init: function () {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(0, 0, 100);
        this.camera.lookAt(project.scene.position);
        this.scene.add(this.camera);

        var light = new THREE.PointLight(0xffffff);
        light.position.set(100, 250, 100);
        this.scene.add(light);

        // SKYBOX
        var skyBoxGeometry = new THREE.CubeGeometry(20000, 20000, 10000);
        var skyBoxMaterial = new THREE.MeshBasicMaterial({color: 0x9999ff, side: THREE.BackSide});
        var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        this.scene.add(skyBox);


        // texture used to generate "bumpiness"
        var bumpTexture = new THREE.ImageUtils.loadTexture(HEIGHT_MAP);
        bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;
        // magnitude of normal displacement
        var bumpScale = 200.0;

        // use "this." to create global object
        var customUniforms = {
            bumpTexture: {type: "t", value: bumpTexture},
            bumpScale: {type: "f", value: bumpScale}
        };

        // create custom material from the shader code above
        //   that is within specially labelled script tags
        var customMaterial = new THREE.ShaderMaterial(
            {
                uniforms: customUniforms,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                side: THREE.DoubleSide
            });

        var planeGeo = new THREE.PlaneGeometry(1000, 1000, 100, 100);
        var plane = new THREE.Mesh(planeGeo, customMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -100;
        this.scene.add(plane);

    },
    onWindowResize: function () {
        project.camera.aspect = window.innerWidth / window.innerHeight;
        project.camera.updateProjectionMatrix();
        project.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    animate: function () {
        requestAnimationFrame(project.animate);
        project.render();
    },
    render: function () {
        this.renderer.render(this.scene, this.camera);
    }
};
