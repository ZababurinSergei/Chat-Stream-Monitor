export const actions =  (self) => {
    return new Promise(async (resolve, reject) => {
        resolve({
            CustomEvents: {
                reset: {
                    offset: (event) => {
                        self.reset = true
                    }
                }
            },
            click: (event) => {
                event.stopPropagation();
                const pagination = self.getState('pagination')
                const welcomeSection = self.closest('welcome-section');

                if(event.target.classList.contains('item') || event.currentTarget.classList.contains('previous') || event.currentTarget.classList.contains('next')) {
                    welcomeSection.cleanState('all', ['post:/api/v1/subscription/filter', 'post:/api/v1/directory/record/filter'])

                    if(event.currentTarget.className.includes('container')) {
                        pagination.page = parseInt(event.target.textContent, 10)
                        pagination.offset = (pagination.page -1) * pagination.limit
                        self.setState('pagination', pagination)
                    }

                    if(event.currentTarget.className.includes('next')) {
                        pagination.page = pagination.page + 1

                        if(pagination.page > pagination.maxPages) {
                            pagination.page = pagination.maxPages
                        }

                        pagination.offset = (pagination.page -1) * pagination.limit
                        self.setState('pagination', pagination)
                    }

                    if(event.currentTarget.className.includes('previous')) {
                        pagination.page = pagination.page - 1

                        if(pagination.page <= 0) {
                            pagination.page = 1
                        }

                        pagination.offset = (pagination.page -1) * pagination.limit

                        self.setState('pagination', pagination)
                    }

                    if(event.currentTarget.className.includes('first')) {
                        pagination.offset = pagination.offset = 0
                        pagination.page = 1
                        self.setState('pagination', pagination)
                    }

                    if(event.currentTarget.className.includes('last')) {
                        pagination.page = pagination.maxPages
                        pagination.offset = (pagination.page -1) * pagination.limit
                        self.setState('pagination', pagination)
                    }
                }
            },
            clickNext: (event) => {
                const pagination = self.getState('pagination')
                if(pagination.maxPages > pagination.page) {
                    self.page = self.page + 1
                    const ferTable = self.closest('fer-table')

                    ferTable.items = {
                        pagination: pagination
                    }
                } else {
                    const ferNotificetion = document.querySelector('fer-notification');
                    ferNotificetion.warning('Записей больше нет');
                }
            }
        })
    })
}

export default {
    description: 'actions'
}