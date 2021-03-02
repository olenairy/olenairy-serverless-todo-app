import * as uuid from 'uuid'
import { TodoItem, PageableTodoItems } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { FileAccess } from '../dataLayer/fileAccess'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import { Key } from 'aws-sdk/clients/dynamodb'

const todoAccess = new TodoAccess()
const fileAccess = new FileAccess()
const logger = createLogger('todos')


export async function getAllTodos(userId: string, nextKey: Key, limit: number): Promise<PageableTodoItems> {
    const items = await todoAccess.getAllTodos(userId, nextKey, limit)

    for (let item of items.todoItems) {
        if (!!item['attachmentUrl'])
            item['attachmentUrl'] = fileAccess.getDownloadUrl(item['attachmentUrl'])
    }

    return items
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {
    const todoId = uuid.v4()

    return await todoAccess.createTodo({
        userId,
        todoId,
        createdAt: new Date().toISOString(),
        ...createTodoRequest
    } as TodoItem)
}


export async function attachTodo(userId:string, todoId: string): Promise<string> {
    const validTodo = await todoAccess.getTodo(userId, todoId)

    if (!validTodo) {
        throw new Error('404')
    }

    const url = fileAccess.getUploadUrl(todoId)
    await todoAccess.updateAttachment(userId, todoId)
    return url
}

export async function updateTodo(userId: string, todoId: string, updatedTodo: UpdateTodoRequest): Promise<void> {
    const validTodo = await todoAccess.getTodo(userId, todoId)

    if (!validTodo) {
        throw new Error('404')
    }
    
    logger.info('Update todo', userId, updatedTodo)
    return await todoAccess.updateTodo(userId, todoId, updatedTodo)
}