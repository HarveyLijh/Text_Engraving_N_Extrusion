import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module'
import { GUI } from 'dat.gui'
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'
import { CSG } from './utils/CSGMesh'
import * as TWEEN from '@tweenjs/tween.js'
import Bender from './utils/bender'
import  * as helvetiker_regular from './assets/fonts/helvetiker_regular.typeface.json'

const bender = new Bender()

const scene = new THREE.Scene()
// scene.background = new THREE.Color('skyblue' )
const light1 = new THREE.SpotLight()
light1.position.set(6.5, 7.5, 7.5)
light1.angle = Math.PI / 4
light1.penumbra = 0.5
scene.add(light1)

const light2 = new THREE.SpotLight()
light2.position.set(-6.5, 7.5, 7.5)
light2.angle = Math.PI / 4
light2.penumbra = 0.5
scene.add(light2)

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
)
camera.position.x = -2
camera.position.y = 1
camera.position.z = -2

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.target.z = -5

const data = {
    text: 'abc123',
}

const material = new THREE.MeshStandardMaterial({
    metalness: .5,
    roughness: .5,
    color: '#049ef4',
})

const cylinderMesh1 = new THREE.Mesh(
    new THREE.CylinderGeometry(6, 6, 1.5, 64, 1, false),
    material
)
const cylinderMesh2 = new THREE.Mesh(
    new THREE.CylinderGeometry(5, 5, 1.6, 64, 1, false),
    material
)
cylinderMesh1.position.set(0, 0, 0)
cylinderMesh2.geometry.rotateX(-Math.PI / 2)
cylinderMesh2.position.set(0, 0, 0)
cylinderMesh2.geometry.rotateX(-Math.PI / 2)

const cylinderCSG1 = CSG.fromMesh(cylinderMesh1)
const cylinderCSG2 = CSG.fromMesh(cylinderMesh2)

const ringCSG = cylinderCSG1.subtract(cylinderCSG2)
const ringMesh = CSG.toMesh(ringCSG, new THREE.Matrix4())

let engravedMesh = new THREE.Mesh(ringMesh.geometry, material)
scene.add(engravedMesh)
let font: Font

const loader = new FontLoader()
loader.load(helvetiker_regular, function (f) {
    font = f
    regenerateGeometry()
})

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

const raycaster = new THREE.Raycaster()

renderer.domElement.addEventListener('dblclick', onDoubleClick, false)
function onDoubleClick(event: MouseEvent) {
    const mouse = {
        x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
        y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
    }

    raycaster.setFromCamera(mouse, camera)

    const intersects = raycaster.intersectObject(engravedMesh, false)
    if (intersects.length > 0) {
        const p = intersects[0].point
        new TWEEN.Tween(controls.target)
            .to(
                {
                    x: p.x,
                    y: p.y,
                    z: p.z,
                },
                200
            )
            .easing(TWEEN.Easing.Cubic.Out)
            .start()
    }
}

const stats = Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()
gui.add(data, 'text').onFinishChange(regenerateGeometry)
gui.open()

function regenerateGeometry() {
    let newGeometry

    newGeometry = new TextGeometry(data.text, {
        font: font,
        size: 1,
        height: 0.2,
        curveSegments: 2,
    })

    newGeometry.center()
    bender.bend(newGeometry, 'y', Math.PI / 16)
    newGeometry.translate(0, 0, -5)

    const textCSG = CSG.fromGeometry(newGeometry)
    const engravedCSG = ringCSG.subtract(textCSG)
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