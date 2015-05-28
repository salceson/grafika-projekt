var project = {
    init: function () {
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0xffffff);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.camera.position.set(10, 20, 10);
        this.camera.lookAt(project.scene.position);
        this.scene.add(this.camera);

        var light = new THREE.DirectionalLight(0xdfdf00, 1.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);

        var img = document.createElement("img");
        img.onload = function () {
            var data = project.getHeightData(img);
            var geometry = new THREE.PlaneGeometry(500, 500, 499, 499);
            var texture = THREE.ImageUtils.loadTexture('assets/tatry-height-map.png');
            var material = new THREE.MeshLambertMaterial({map: texture});
            var plane = new THREE.Mesh(geometry, material);
            for (var i = 0; i < plane.geometry.vertices.length; i++) {
                plane.geometry.vertices[i].z = data[i];
            }
            project.scene.add(plane);
        };
        img.src = "assets/tatry-height-map.png";
        document.body.appendChild(this.renderer.domElement);
        window.addEventListener('resize', this.onWindowResize, false);
    },
    onWindowResize: function () {
        project.camera.aspect = window.innerWidth / window.innerHeight;
        project.camera.updateProjectionMatrix();
        project.renderer.setSize(window.innerWidth, window.innerHeight);
    },
    animate: function () {
        requestAnimationFrame(project.animate);
        project.renderer.render(project.scene, project.camera);
    },
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
    }
};
