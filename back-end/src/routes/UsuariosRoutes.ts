import { Router } from 'express'
import { listarUsuarios } from '../controllers/UsuariosController'
import { atualizarUsuario } from '../controllers/UsuariosController'
import { inserirUsuario } from '../controllers/UsuariosController'
import { excluirUsuario } from '../controllers/UsuariosController'

const router = Router()

router.get('/', listarUsuarios)
router.post('/', inserirUsuario)
router.put('/', atualizarUsuario)
router.delete('/', excluirUsuario)

export default router

