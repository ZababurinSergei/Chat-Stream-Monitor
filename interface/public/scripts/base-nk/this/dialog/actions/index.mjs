export const actions = {
    input: async function(event) {

    },
    schema: async function(event) {

    },
    save: async function(event) {

    },
    update: async function(event) {

    },
    reset: async function(event) {
        console.log('reset:', this)
        this.close()
    },
    next: async function(event) {

    },
    cancel: async function(event) {
        console.log('cancel:')
        this.close()
    },
    success: async function(event) {
        this.close()
    },
    remove: async function(event) {

    },
    close: async function(event) {
        console.log('close:')
        this.close()
    },
}