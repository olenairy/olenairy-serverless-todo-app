import * as AWS from 'aws-sdk'
import { Key } from 'aws-sdk/clients/dynamodb'
import * as AWSXRay from 'aws-xray-sdk'
import { TodoItem, PageableTodoItems } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'

 
const docClient = new AWS.DynamoDB.DocumentClient({
  service: AWSXRay.captureAWSClient(new AWS.DynamoDB({ signatureVersion: 'v4' }))
})
docClient.get
export class TodoAccess {

  constructor(
    //private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todosTable = process.env.TODOS_TABLE,
    private readonly userIdIndex = process.env.USER_ID_INDEX) {
  }

  async getTodo(userId: string, todoId: string): Promise<TodoItem> {
    const result = await docClient
      .get({
        TableName: this.todosTable,
        Key: { userId, todoId }
      })
      .promise()

    return result.Item as TodoItem
  }

  async getAllTodos(userId: string, nextKey: Key, limit: number): Promise<PageableTodoItems> {
    console.log('Get all todos of user')

    const result = await  docClient.query({
      TableName: this.todosTable,
      IndexName: this.userIdIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: nextKey
    }).promise()

    const items = result.Items as TodoItem[]
    return { todoItems: items, lastEvaluatedKey: result.LastEvaluatedKey }
  }

  async createTodo(newItem: TodoItem): Promise<TodoItem> {
    await  docClient.put({
      TableName: this.todosTable,
      Item: newItem
    }).promise()

    return newItem
  }

  async deleteTodo(userId: string, todoId: string): Promise<void> {
    await  docClient.delete({
      TableName: this.todosTable,
      Key: { userId, todoId }
    }).promise()
  }

  async updateTodo(userId: string, todoId: string, updatedTodo: TodoUpdate): Promise<void> {
    await  docClient.update({
      TableName: this.todosTable,
      Key: { userId, todoId },
      UpdateExpression: "set #name = :n, dueDate=:dueDate, done=:done",
      ExpressionAttributeValues: {
        ":n": updatedTodo.name,
        ":dueDate": updatedTodo.dueDate,
        ":done": updatedTodo.done
      },
      ExpressionAttributeNames: { '#name': 'name' },
      ReturnValues: "NONE"
    }).promise()
  }


  async updateAttachment(userId: string, todoId: string): Promise<void> {
    await  docClient.update({
      TableName: this.todosTable,
      Key: { userId, todoId },
      UpdateExpression: "set attachmentUrl=:a",
      ExpressionAttributeValues: {
        ":a": todoId
      },
      ReturnValues: "NONE"
    }).promise()
  }

}


