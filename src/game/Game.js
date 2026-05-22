import { SceneManager } from './SceneManager'
import { Input } from './Input'
import { GameState } from './GameState'
import { Player } from '../entities/Player'
import { Enemy } from '../entities/Enemy'
import { Objective } from '../entities/Objective'
import { ExitZone } from '../entities/ExitZone'
import { LevelLoader } from '../level/LevelLoader'
import { CollisionSystem } from '../systems/CollisionSystem'
import { DetectionSystem } from '../systems/DetectionSystem'
import { NavigationSystem } from '../systems/NavigationSystem'
import { ObjectiveSystem } from '../systems/ObjectiveSystem'
import { ExitSystem } from '../systems/ExitSystem'
import { HUD } from '../ui/HUD'
import { Screens } from '../ui/Screens'
import { Menu } from '../ui/Menu'

export class Game {
  constructor() {
    this.sceneManager = new SceneManager()
    this.input = new Input()

    this.scene = this.sceneManager.scene
    this.camera = this.sceneManager.camera
    this.renderer = this.sceneManager.renderer

    this.screens = new Screens(
      () => this.startNewGame(),
      () => this.returnToMenu()
    )
    this.menu = new Menu(() => this.startNewGame())

    this.gameState = GameState.MENU
    this.worldInitialized = false
    this.previewDuration = 15
    this.previewTimeLeft = this.previewDuration
    this.previewCameraTarget = { x: 0, z: 0 }
    this.previewCameraSpeed = 8
    this.darkPhaseElapsed = 0
    this.lastFrameTime = performance.now()
  }

  startNewGame() {
    if (this.worldInitialized) {
      this.clearWorld()
    }

    this.setupWorld()
    this.startPreviewPhase()
    this.screens.hide()
  }

  returnToMenu() {
    if (this.worldInitialized) {
      this.clearWorld()
    }

    this.gameState = GameState.MENU
    this.screens.hide()
    this.menu.show()
  }

  setupWorld() {
    this.levelLoader = new LevelLoader(this.scene)
    this.levelLoader.loadTestLevel()

    this.collisionSystem = new CollisionSystem(this.levelLoader.walls)
    this.detectionSystem = new DetectionSystem(this.levelLoader.walls)
    this.navigationSystem = new NavigationSystem(
      this.levelLoader.walls,
      this.levelLoader.navigationPoints
    )
    this.objectiveSystem = new ObjectiveSystem()
    this.exitSystem = new ExitSystem()

    this.player = new Player()
    this.scene.add(this.player.mesh)

    this.enemy = new Enemy(4.5, 2.5, this.levelLoader.patrolPoints)
    this.scene.add(this.enemy.mesh)

    this.objective = new Objective(7.6, -7.6)
    this.scene.add(this.objective.mesh)

    this.exitZone = new ExitZone(-9, 8.4)
    this.scene.add(this.exitZone.mesh)

    this.hasObjective = false
    this.hasWon = false

    if (this.hud) {
        this.hud.destroy()
    }
    this.hud = new HUD(this.camera, this.renderer, this.enemy)

    this.setupPlayer()
    this.setupCamera()
    this.sceneManager.attachPlayerLight(this.player.mesh)

    this.worldInitialized = true
  }

  clearWorld() {
    if (this.player) this.scene.remove(this.player.mesh)
    if (this.enemy) this.scene.remove(this.enemy.mesh)
    if (this.objective && !this.objective.isCollected) {
      this.scene.remove(this.objective.mesh)
    }
    if (this.exitZone) this.scene.remove(this.exitZone.mesh)

    if (this.levelLoader) {
      for (const wall of this.levelLoader.walls) {
        this.scene.remove(wall)
      }
      for (const object of this.levelLoader.objects) {
        if (object !== this.objective?.mesh && object !== this.exitZone?.mesh) {
          this.scene.remove(object)
        }
      }
    }

    this.sceneManager.detachPlayerLight()

    if (this.hud) {
      this.hud.destroy()
      this.hud = null
    }

    this.worldInitialized = false
  }

  setupPlayer() {
    this.player.mesh.position.set(-9.2, 0.5, 8.4)
  }

  setupCamera() {
    this.camera.fov = 55
    this.camera.updateProjectionMatrix()
    this.camera.position.set(
      this.player.mesh.position.x,
      11,
      this.player.mesh.position.z + 7
    )
    this.camera.lookAt(this.player.mesh.position)
  }

  setupPreviewCamera(target = this.previewCameraTarget) {
    this.camera.fov = 55
    this.camera.updateProjectionMatrix()
    this.camera.position.set(target.x, 11, target.z + 7)
    this.camera.lookAt(target.x, 0, target.z)
  }

  startPreviewPhase() {
    this.previewTimeLeft = this.previewDuration
    this.previewCameraTarget = { x: 0, z: 0 }
    this.gameState = GameState.PREVIEW
    this.input.clearJustPressed()
    this.setupPreviewCamera()
    this.sceneManager.setPreviewLighting()
  }

  startDarkPhase() {
    this.gameState = GameState.PLAYING
    this.darkPhaseElapsed = 0
    this.input.clearJustPressed()
    this.setupCamera()
    this.sceneManager.setDarkLighting()
  }

  endGame(state, reason) {
    this.gameState = state
    this.sceneManager.setPreviewLighting()
    this.previewCameraTarget = {
      x: this.player.mesh.position.x,
      z: this.player.mesh.position.z,
    }
    this.setupPreviewCamera()

    if (state === GameState.VICTORY) {
      this.screens.showVictory()
    } else {
      this.screens.showGameOver(reason)
    }
  }

  updateCamera() {
    const targetX = this.player.mesh.position.x
    const targetZ = this.player.mesh.position.z + 7

    this.camera.position.x = targetX
    this.camera.position.y = 11
    this.camera.position.z = targetZ
    this.camera.lookAt(this.player.mesh.position)
  }

  updateObjective() {
    if (this.hasObjective) return

    const canCollect = this.objectiveSystem.canCollect(this.player, this.objective)

    if (canCollect) {
      this.objective.collect(this.scene)
      this.hasObjective = true
    }
  }

  updateExit() {
    if (!this.hasObjective) return

    const atExit = this.exitSystem.isPlayerAtExit(this.player, this.exitZone)

    if (atExit) {
      this.endGame(GameState.VICTORY)
    }
  }

  updateDetection() {
    const detected = this.detectionSystem.canDetectPlayer(this.enemy, this.player)
    this.enemy.updateDetection(detected)
  }

  updateGameOver() {
    const playerPos = this.player.mesh.position
    const enemyPos = this.enemy.mesh.position

    const dx = playerPos.x - enemyPos.x
    const dz = playerPos.z - enemyPos.z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance < 0.8) {
      this.endGame(GameState.GAME_OVER, 'Охрана вас поймала. Свет включён, можно начать заново.')
    }
  }

  updateRestart() {
    if (this.input.wasKeyPressed('r')) {
      this.startNewGame()
    }
  }

  updateSurrender() {
    if (this.darkPhaseElapsed < 0.5) return

    if (this.input.wasKeyPressed('space')) {
      this.endGame(GameState.GAME_OVER, 'Вы заблудились и решили прекратить попытку. Свет включён.')
    }
  }

  updatePreviewCamera(deltaTime) {
    let moveX = 0
    let moveZ = 0

    if (this.input.isKeyDown('w')) moveZ -= 1
    if (this.input.isKeyDown('s')) moveZ += 1
    if (this.input.isKeyDown('a')) moveX -= 1
    if (this.input.isKeyDown('d')) moveX += 1

    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.hypot(moveX, moveZ)
      moveX /= length
      moveZ /= length

      this.previewCameraTarget.x += moveX * this.previewCameraSpeed * deltaTime
      this.previewCameraTarget.z += moveZ * this.previewCameraSpeed * deltaTime
      this.previewCameraTarget.x = Math.max(-9.5, Math.min(9.5, this.previewCameraTarget.x))
      this.previewCameraTarget.z = Math.max(-9.5, Math.min(9.5, this.previewCameraTarget.z))
    }

    this.setupPreviewCamera()
  }

  updatePreview(deltaTime) {
    this.updatePreviewCamera(deltaTime)
    this.previewTimeLeft -= deltaTime

    if (this.previewTimeLeft <= 0) {
      this.previewTimeLeft = 0
      this.startDarkPhase()
    }

    this.hud.update(this.hasObjective, this.gameState, this.previewTimeLeft)
  }

  update() {
    const now = performance.now()
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1)
    this.lastFrameTime = now

    if (this.gameState === GameState.MENU) {
      return
    }

    if (this.gameState === GameState.PREVIEW) {
      this.updatePreview(deltaTime)
      return
    }

    if (this.gameState !== GameState.PLAYING) {
      this.hud.update(this.hasObjective, this.gameState, this.previewTimeLeft)
      this.updateRestart()
      return
    }

    this.darkPhaseElapsed += deltaTime
    this.player.update(this.input, this.collisionSystem)
    this.updateSurrender()
    this.updateObjective()
    this.updateExit()
    this.updateDetection()
    this.enemy.update(this.collisionSystem, this.player, this.navigationSystem)
    this.updateGameOver()
    this.updateCamera()
    this.hud.update(this.hasObjective, this.gameState, this.previewTimeLeft)
  }

  animate = () => {
    requestAnimationFrame(this.animate)

    this.update()
    this.sceneManager.render()
  }

  start() {
    this.menu.show()
    this.animate()
  }
}
