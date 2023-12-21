const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')
const express = require('express')
const sqlite3 = require('sqlite3')
const path = require('path')
const {open} = require('sqlite')
const dbpath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())
let db = null
const initalize = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is start!!')
    })
  } catch (e) {
    console.log(`error message: ${e.message}`)
    process.exit(1)
  }
}

initalize()

const checkRequestsQueries = async (request, response, next) => {
  const {search_q, category, priority, status, date} = request.query
  const {todoId} = request.params
  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)

      const formatedDate = format(new Date(date), 'yyyy-MM-dd')

      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )

      const isValidDate = await isValid(result)

      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  next()
}

const convert = data => {
  return {
    id: data.id,
    todo: data.todo,
    category: data.category,
    priority: data.priority,
    status: data.status,
    dueDate: data.due_date,
  }
}

const hasStatus = requestquery => {
  return requestquery.status !== undefined
}
const hasPriority = requestquery => {
  return requestquery.priority !== undefined
}
const hasPriorityandhasStatus = requestquery => {
  return (
    requestquery.priority !== undefined && requestquery.status !== undefined
  )
}
const hasCategoryandhasStatus = requestquery => {
  return (
    requestquery.category !== undefined && requestquery.status !== undefined
  )
}
const hasCategory = requestquery => {
  return requestquery.category !== undefined
}
const hasCategroryandhasPriority = requestquery => {
  return (
    requestquery.category !== undefined && requestquery.priority !== undefined
  )
}

app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {search_q = '', status, category, priority} = request.query
  let getTodoQuery = ''
  switch (true) {
    case hasStatus(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and status = '${status}';`
      break
    case hasPriority(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and priority = '${priority}';`
      break
    case hasPriorityandhasStatus(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and priority = '${priority}' and status ='${status}';`
      break
    case hasCategoryandhasStatus(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and category = '${category}' and status ='${status}';`
      break
    case hasCategory(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and category = '${category}';`
      break
    case hasCategroryandhasPriority(request.query):
      getTodoQuery = `select * from todo where todo like '%${search_q}%' and category = '${category}' and priority ='${priority}';`
      break
    default:
      getTodoQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }
  const dataTodo = await db.all(getTodoQuery)
  response.send(dataTodo.map(each => convert(each)))
})

app.get('/todos/:todoId/', checkRequestsQueries, async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo where id =${todoId};`
  const data = await db.get(getTodoQuery)
  response.send(convert(data))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    const isDateValid = isValid(new Date(date))
    if (isDateValid) {
      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      const getTodoQuery = `select id,todo,priority,status,category,due_date as dueDate from todo where due_date ='${formatedDate}';`
      const data = await db.all(getTodoQuery)
      response.send(data)
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

const checkRequestsBody = (request, response, next) => {
  const {category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (category !== undefined) {
    categoryArray = ['WORK', 'HOME', 'LEARNING']
    categoryIsInArray = categoryArray.includes(category)

    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (priority !== undefined) {
    priorityArray = ['HIGH', 'MEDIUM', 'LOW']
    priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (status !== undefined) {
    statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    statusIsInArray = statusArray.includes(status)
    if (statusIsInArray === true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')

      const result = toDate(new Date(formatedDate))
      const isValidDate = isValid(result)

      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  next()
}

app.post('/todos/', checkRequestsBody, async (request, response) => {
  const {id, todo, priority, category, status, dueDate} = request.body
  const postTodoQuery = `insert into todo(id,todo,category,priority,status,due_date)
                         values(
                             '${id}',
                             '${todo}',
                             '${priority}',
                             '${category}',
                             '${status}',
                             '${dueDate}'
                         );`
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', checkRequestsBody, async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      updateColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      updateColumn = 'Due Date'
      break
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`

  await db.run(updateTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getdeleteQuery = `delete from todo where id = ${todoId};`
  await db.run(getdeleteQuery)
  response.send('Todo Deleted')
})
module.exports = app
