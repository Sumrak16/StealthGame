import * as THREE from 'three'
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
import { getLevelById } from '../level/levels'
import { AssetManager } from '../assets/AssetManager'
import { AudioManager } from '../audio/AudioManager'
import { PreviewGuidanceSystem } from '../systems/PreviewGuidanceSystem'
import { AlarmSystem } from '../systems/AlarmSystem'
import { DoorSystem } from '../systems/DoorSystem'
import { loadTiledLevel } from '../level/TiledLevelParser'
import { CharacterVisualController } from '../entities/CharacterVisualController'

export class Game {
  constructor() {
    this.sceneManager = new SceneManager()
    this.input = new Input()

    this.scene = this.sceneManager.scene
    this.camera = this.sceneManager.camera
    this.renderer = this.sceneManager.renderer
    this.assetManager = new AssetManager(this.renderer)
    this.audioManager = new AudioManager(this.camera)
    this.previewAudioTarget = new THREE.Object3D()
    this.scene.add(this.previewAudioTarget)

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
    this.previewCameraBounds = {
      minX: -9.5,
      maxX: 9.5,
      minZ: -9.5,
      maxZ: 9.5,
    }
    this.currentLevel = getLevelById()
    this.darkPhaseElapsed = 0
    this.lastFrameTime = performance.now()
  }

  async loadCurrentLevel() {
    try {
      this.currentLevel = await loadTiledLevel('/levels/house-1.json')
    } catch (error) {
      console.warn('Tiled level was not loaded, using fallback level.', error)
      this.currentLevel = getLevelById()
    }
  }

  async startNewGame() {
    this.audioManager.resume()
    this.audioManager.stopAlarm()

    if (this.worldInitialized) {
      this.clearWorld()
    }

    await this.loadCurrentLevel()
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
    this.levelLoader = new LevelLoader(this.scene, this.assetManager)
    this.levelLoader.loadLevel(this.currentLevel)
    this.audioManager.attachSoundSources(this.levelLoader.soundSources)
    this.previewGuidanceSystem = new PreviewGuidanceSystem(
      this.scene,
      this.levelLoader.soundSources
    )

    this.collisionSystem = new CollisionSystem(this.levelLoader.walls)
    this.detectionSystem = new DetectionSystem(this.levelLoader.walls)
    this.navigationSystem = new NavigationSystem(
      this.levelLoader.walls,
      this.levelLoader.navigationPoints
    )
    this.objectiveSystem = new ObjectiveSystem(this.currentLevel.objective)
    this.exitSystem = new ExitSystem()
    this.alarmSystem = new AlarmSystem(this.levelLoader.alarmZones)
    this.doorSystem = new DoorSystem(this.levelLoader.doors, this.audioManager)

    this.player = new Player()
    this.scene.add(this.player.mesh)
    this.audioManager.attachListener(this.player.mesh)
    this.attachPlayerModel()

    const enemyData = this.currentLevel.enemies?.[0] ?? { x: 0, z: 0, patrolPoints: [] }
    this.enemy = new Enemy(enemyData.x, enemyData.z, enemyData.patrolPoints)
    this.scene.add(this.enemy.mesh)
    this.attachEnemyModel()
    this.audioManager.attachGuard(this.enemy.mesh)

    this.objective = new Objective(this.currentLevel.objective.x, this.currentLevel.objective.z)
    this.scene.add(this.objective.mesh)

    this.exitZone = new ExitZone(
      this.currentLevel.exit.x,
      this.currentLevel.exit.z,
      this.currentLevel.exit.width,
      this.currentLevel.exit.depth
    )
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
    this.audioManager.detachSoundSources()
    this.previewGuidanceSystem?.destroy()
    this.previewGuidanceSystem = null
    this.playerVisualController = null
    this.enemyVisualController = null

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
    this.player.mesh.position.set(
      this.currentLevel.playerStart.x,
      0.5,
      this.currentLevel.playerStart.z
    )
  }

  attachEnemyModel() {
    this.assetManager.createAnimatedModel('/assets/models/characters/swat.glb', {
      x: 0.9,
      y: 1.4,
      z: 0.9,
    }, { floorOffset: -0.5 }).then(({ model, animations }) => {
      if (!this.isRenderableModel(model)) return

      this.enemy.mesh.add(model)

      for (const child of this.enemy.mesh.children) {
        if (child !== model && child.visible !== undefined) {
          child.visible = false
        }
      }

      this.enemyVisualController = new CharacterVisualController(
        this.enemy.mesh,
        model,
        animations
      )
    }).catch((error) => {
      console.warn('Enemy model was not loaded.', error)
    })
  }

  attachPlayerModel() {
    this.assetManager.createAnimatedModel('/assets/models/characters/person.glb', {
      x: 0.85,
      y: 1.35,
      z: 0.85,
    }, { floorOffset: -0.5 }).then(({ model, animations }) => {
      if (!this.isRenderableModel(model)) return

      this.player.mesh.add(model)

      for (const child of this.player.mesh.children) {
        if (child !== model && child.visible !== undefined) {
          child.visible = false
        }
      }

      this.playerVisualController = new CharacterVisualController(
        this.player.mesh,
        model,
        animations
      )
    }).catch((error) => {
      console.warn('Player model was not loaded.', error)
    })
  }

  isRenderableModel(model) {
    const box = new THREE.Box3().setFromObject(model)
    const size = box.getSize(new THREE.Vector3())
    return Number.isFinite(size.x) && Number.isFinite(size.y) && Number.isFinite(size.z) &&
      size.x > 0.01 && size.y > 0.01 && size.z > 0.01
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
    this.previewCameraTarget = { ...this.currentLevel.previewCameraTarget }
    this.previewCameraBounds = { ...this.currentLevel.previewCameraBounds }
    this.gameState = GameState.PREVIEW
    this.input.clearJustPressed()
    this.setupPreviewCamera()
    this.previewAudioTarget.position.set(
      this.previewCameraTarget.x,
      0.5,
      this.previewCameraTarget.z
    )
    this.audioManager.attachListener(this.previewAudioTarget)
    this.sceneManager.setPreviewLighting()
    this.audioManager.startSoundSources()
    this.previewGuidanceSystem?.show()
  }

  startDarkPhase() {
    this.gameState = GameState.PLAYING
    this.darkPhaseElapsed = 0
    this.input.clearJustPressed()
    this.setupCamera()
    this.audioManager.attachListener(this.player.mesh)
    this.sceneManager.setDarkLighting()
    this.previewGuidanceSystem?.hide()
    this.audioManager.startSoundSources()
  }

  endGame(state, reason) {
    this.gameState = state
    this.sceneManager.setPreviewLighting()
    this.audioManager.stopSoundSources()
    this.previewGuidanceSystem?.hide()
    this.previewCameraTarget = {
      x: this.player.mesh.position.x,
      z: this.player.mesh.position.z,
    }
    this.setupPreviewCamera()
    this.previewAudioTarget.position.set(
      this.previewCameraTarget.x,
      0.5,
      this.previewCameraTarget.z
    )
    this.audioManager.attachListener(this.previewAudioTarget)

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
    if (this.objectiveSystem.tryComplete(this.player, this.objective, this.scene)) {
      this.hasObjective = this.objectiveSystem.isCompleted()
    }
  }

  updateExit() {
    if (!this.objectiveSystem.canUseExit()) return

    const atExit = this.exitSystem.isPlayerAtExit(this.player, this.exitZone)

    if (atExit) {
      this.endGame(GameState.VICTORY)
    }
  }

  updateDetection() {
    const detected = this.detectionSystem.canDetectPlayer(this.enemy, this.player)
    this.enemy.updateDetection(detected)
  }

  updateAlarm() {
    const alarmZone = this.alarmSystem.update(this.player)

    if (!alarmZone) return

    this.audioManager.playAlarm()
    this.endGame(
      GameState.GAME_OVER,
      'Вы наступили на плиту сигнализации. В доме поднята тревога.'
    )
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
      this.previewCameraTarget.x = Math.max(
        this.previewCameraBounds.minX,
        Math.min(this.previewCameraBounds.maxX, this.previewCameraTarget.x)
      )
      this.previewCameraTarget.z = Math.max(
        this.previewCameraBounds.minZ,
        Math.min(this.previewCameraBounds.maxZ, this.previewCameraTarget.z)
      )
    }

    this.setupPreviewCamera()
    this.previewAudioTarget.position.set(
      this.previewCameraTarget.x,
      0.5,
      this.previewCameraTarget.z
    )
  }

  updatePreview(deltaTime) {
    this.updatePreviewCamera(deltaTime)
    this.previewGuidanceSystem?.update(this.previewCameraTarget, deltaTime)
    this.enemy.update(this.collisionSystem, this.player, this.navigationSystem)
    this.enemyVisualController?.update(deltaTime, this.enemy.wasMoving)
    this.previewTimeLeft -= deltaTime

    if (this.previewTimeLeft <= 0) {
      this.previewTimeLeft = 0
      this.startDarkPhase()
    }

    this.updateHud()
  }

  updateHud() {
    const missionText = this.objectiveSystem?.getMissionText(this.gameState)
    this.hud.update(missionText, this.gameState, this.previewTimeLeft)
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
      this.updateHud()
      this.updateRestart()
      return
    }

    this.darkPhaseElapsed += deltaTime
    const playerMoved = this.player.update(this.input, this.collisionSystem)
    this.audioManager.update(deltaTime, playerMoved)
    this.playerVisualController?.update(deltaTime, playerMoved)
    this.updateSurrender()
    this.doorSystem.update(this.player, this.input, deltaTime)
    this.updateObjective()
    this.updateExit()
    this.updateAlarm()
    this.updateDetection()
    this.enemy.update(this.collisionSystem, this.player, this.navigationSystem)
    this.enemyVisualController?.update(deltaTime, this.enemy.wasMoving)
    this.updateGameOver()
    this.updateCamera()
    this.updateHud()
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
