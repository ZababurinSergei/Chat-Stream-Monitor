export default async (self, actions) => {
    return {
        execute: (event) => actions.filter.execute(event)
    }
}