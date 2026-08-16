export const validate = (props) => {
    let res = /^[a-z]+$/.test('sFjd');
    console.log('------------------------- props ------------------------- ', res)

    return true
}

export default {
    description: "validate input"
}