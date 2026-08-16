import {loadHTML} from '../index.mjs'

let components = new Map();

components.set('default', [{
    type: 'component',
    template: async (slot, props = {}) => {
        let template = ''
        let keys = []
        switch(slot) { 
            default:
                return `
                    <div class="dropdown">
          <div class="dropdown__wrapper">
            <div class="dropdown_input">
              <button class="dropdown__button" type="button">Фильтр 1</button>
            </div>
            <div class="dropdown__button_arrow"></div>
          </div>
          <ul class="dropdown__list">
            <li class="dropdown__list-item" data-event-snapshot-id="1756c3b2-94f3-45ee-bded-f49ec4c37645"
                data-event-id="097f14fd-2561-45ae-93b8-c6c383c08ffa"
                data-schema-id="showcase.booking.mo.1.0.0" data-value="showcase.booking.mo.1.0.0">
              showcase.booking.mo.1.0.0
            </li>
            <li class="dropdown__list-item" data-event-snapshot-id="6ccb96ce-2191-4fc5-8eb3-de67ab5c64d4"
                data-event-id="34999933-ff08-4bd4-9a81-a4df6882259d"
                data-schema-id="showcase.booking.resource.1.0.0"
                data-value="showcase.booking.resource.1.0.0">showcase.booking.resource.1.0.0
            </li>
            <li class="dropdown__list-item" data-event-snapshot-id="e6fe7a00-af2f-459c-b5a2-8fb9a28626a3"
                data-event-id="b82d6712-04c9-4cbf-a179-bcbefef5e89e"
                data-schema-id="showcase.booking.service.1.0.0" data-value="showcase.booking.service.1.0.0">
              showcase.booking.service.1.0.0
            </li>
          </ul>
          <input class="dropdown__input_hidden" type="text" name="select-category" value="Фильтр 1" />
        </div>
                `
            break
        }
    }
}])


export default components