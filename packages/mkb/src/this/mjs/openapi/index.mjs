import SwaggerUI from 'swagger-ui'


// console.log('SwaggerUI', SwaggerUI)
// export { SwaggerUI }

const swagger = SwaggerUI({
    dom_id: '#swagger'
})

export { swagger }
export default {
    description: "SwaggerUI"
}