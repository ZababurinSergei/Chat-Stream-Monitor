let components = new Map();

components.set('default', [{
    type: 'component',
    css: 'index.shadow.css',
    template: async (type, props = {}) => {
        let template = ''
        let keys = []
        switch(type) {
            default:
                return`
                    <div class="welcome__scroll">
                        <div class="scroll">
                            <div class="scroll__up-block">
                                <div class="scroll__left"></div>
                                <div class="scroll__right"></div>
                            </div>
                            <p class="scroll__title">scroll</p>
                        </div>
                    </div>`
        }
    }
}])


export default components