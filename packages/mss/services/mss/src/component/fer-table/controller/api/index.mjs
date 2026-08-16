import { table, template } from '../../views/index.mjs';
import { router, store } from '../../../../this/index.mjs';

export default async (self, actions) => {
    return {
        set: {
            items: async (data = undefined) => {
                if(data) {
                    self.refresh({
                        isCleanHTML: false
                    })
                }
            }
        },
        input: {
            code: (event, props = undefined) => actions.card.code(event, props),
            name: (event, props = undefined) => actions.card.name(event, props)
        },
        button: {
            delete: (event, props = undefined) => actions.card.delete(event, props),
            edit: (event, props = undefined) => actions.card.edit(event, props)
        },
        click: {
            item: (event) => {
                actions.registry.item.click(event)
            }
        }
    }
}