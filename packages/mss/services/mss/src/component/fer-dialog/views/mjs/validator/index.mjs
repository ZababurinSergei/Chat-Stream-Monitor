export const isEmptyInput = () => {

}

export const isNameSchema = (props) => props.match(/^[a-zA-Z0-9\-._]+$/) != null;
export const isLatin = (props) => props.match(/^[a-zA-Z0-9]+$/) != null;

export default {
    description: "Валидатор"
}