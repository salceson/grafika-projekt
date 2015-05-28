var project = {
    init: function () {
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
        this.scene = new THREE.Scene();
        var light = new THREE.DirectionalLight(0xdfdf00, 1.5);
        light.position.set(1, 1, 1);
        this.scene.add(light);
    },
    animate: function () {

    }
};
