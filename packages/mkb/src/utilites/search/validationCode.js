/*
проверки на допустимые символы:
o  буквы латинского алфавита A-z (регистронезависимые);
o  цифры 0-9;
o  «.» точка, не более одного раза подряд;
o  «/» прямой слэш, не более одного раза подряд;
o  «&» амперсанд, не более одного раза подряд.
 */
import isEmpty from "../isEmpty";

export function validationCode(code) {
	let data = ''
	let error = ''
	const regexp =
	code = code.replace(/ /g,'')

	if(!isEmpty(code)) {
		let isDoubleDots = /[\.\&]{2}/.test(code)
		let isDoubleSlash = /[\\/\&]{2}/.test(code)
		let isDouble = /[\\./\&]{2}/.test(code)
		const lastChar = code.charAt(code.length -1)
		let isLastSymbol = !/[A-Za-z0-9]/.test(lastChar)
		let incorrectSymbol = !/[a-zA-Z0-9./&]/.test(code)


		data = code.match(/[a-zA-Z0-9./&]/g)
		if(!isEmpty(data)) {
			data = data.join('')
		}

		if(isDoubleDots || incorrectSymbol || isDoubleSlash || isDouble) {
			error = `
				Введен недопустимый символ. Могут быть использованы только буквы латинского алфавита без учета регистра, цифры 0-9, а также символы «.», «/» и «&» не более одного раза подряд
			`
		} else if(isLastSymbol) {
			error = `
				Символ "${lastChar}" не может быть указан последним для корректной расшифровки диагноза
			`
		} else {
			error = isEmpty(code.replace(data, '')) ? '' :`
			Введен недопустимый символ. Могут быть использованы только буквы латинского алфавита без учета регистра, цифры 0-9, а также символы «.», «/» и «&» не более одного раза подряд

			`
		}
	}

	return {
		data: data,
		error: error
	};
}
