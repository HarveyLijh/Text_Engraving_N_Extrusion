import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { CSG } from './utils/CSGMesh'
import * as TWEEN from '@tweenjs/tween.js'
import * as helvetiker_regular from './assets/fonts/helvetiker_regular.typeface.json'


const scene = new THREE.Scene()
// scene.background = new THREE.Color('skyblue' )
const light1 = new THREE.SpotLight()
light1.position.set(53.2, -30.4, -39.3)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
scene.add(light1)

const light2 = new THREE.SpotLight()
light2.position.set(-6.5, 7.5, 7.5)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
scene.add(light2)
const light = new THREE.AmbientLight(0x404040); // soft white light
scene.add(light);
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.x = -2
camera.position.y = 1
camera.position.z = 8

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.z = -5

const data = {
    text: 'Text Engrave',
    cube_scale_x: 10,
    cube_scale_y: 5,
    cube_scale_z: 5,
    modifier:'Engrave'
}

const material = new THREE.MeshStandardMaterial({
    metalness: .2,
    roughness: 0,
    color: '#049ef4',
})
const material2 = new THREE.MeshStandardMaterial({
    metalness: .2,
    roughness: 0,
    color: 'red',
})
// create cube to be engraved
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(data.cube_scale_x, data.cube_scale_y, data.cube_scale_z),
    material
)
const cubeCSG = CSG.fromMesh(cube)
const originMeshCSG = cubeCSG
const originMesh = CSG.toMesh(originMeshCSG, new THREE.Matrix4())
let engravedMesh = new THREE.Mesh(originMesh.geometry, material)
scene.add(engravedMesh)

let font: Font

// load font and generate text mesh
const loader = new FontLoader()
loader.load(helvetiker_regular, function (f) {
    font = f
    regenerateGeometry()
})

// shift camera poisiton when resizing window
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

//  show stats gui to change text
const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()

const lightFolder = gui.addFolder('Ambient Light')
lightFolder.add(light, 'intensity', 0, 10, 0.5)
lightFolder.open()

const textFolder = gui.addFolder('Text Engraving')
textFolder.add(data, 'text').onFinishChange(regenerateGeometry)
textFolder.add(data, 'modifier', [ 'Engrave', 'Extrude' ] ).onFinishChange(regenerateGeometry)
textFolder.open()

gui.open()

//  change text engraving based on gui input
function regenerateGeometry() {
    let textGeometry

    textGeometry = new TextGeometry(data.text.substring(0,12), {
        font: font,
        size: 1,
        height: 0.8,
        curveSegments: 2,
    })

    textGeometry.center()
    textGeometry.translate(0, 0, 2.4)

    //  reduce the text CSG out of out the original mesh to engrave
    const textCSG = CSG.fromGeometry(textGeometry)
    let engravedCSG = originMeshCSG.subtract(textCSG);
    console.log(data.modifier)
    if(data.modifier == 'Extrude'){
        engravedCSG = originMeshCSG.union(textCSG)
    }
    engravedMesh.geometry.dispose()
    engravedMesh.geometry = CSG.toMesh(
        engravedCSG,
        new THREE.Matrix4()
    ).geometry
}

function animate() {
    requestAnimationFrame(animate)
    controls.update()
    TWEEN.update()
    render()
    stats.update()
}

function render() {
    renderer.render(scene, camera)
}

animate()