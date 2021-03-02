
import { PageableTodoItems } from '../models/TodoItem'
import { TodoAccess } from '../dataLayer/todoAccess'

import { FileAccess } from '../dataLayer/fileAccess'


import { Key } from 'aws-sdk/clients/dynamodb'

const todoAccess = new TodoAccess()
const fileAccess = new FileAccess()



export async function getAllTodos(userId: string, nextKey: Key, limit: number): Promise<PageableTodoItems> {
    const items = await todoAccess.getAllTodos(userId, nextKey, limit)

    for (let item of items.todoItems) {
        if (!!item['attachmentUrl'])
            item['attachmentUrl'] = fileAccess.getDownloadUrl(item['attachmentUrl'])
    }

    return items
}
