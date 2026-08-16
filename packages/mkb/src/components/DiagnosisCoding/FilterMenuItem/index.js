import React, {useContext} from 'react';
import axios from "axios";
import './FilterMenuItem.style.css';

function FilterMenuItem({ title, selectOption, object, className }) {

	const onClickHandler = async (object) => {
		if(object.hasOwnProperty('type') && object.type === 'link') {

			try {
				const response = await axios.get(
					object.link,
					{
						responseType: "blob",
					}
				);

				const url = window.URL.createObjectURL(new Blob([response.data]));
				const link = document.createElement("a");
				link.href = url;
				link.setAttribute(
					"download",
					`Сопоставление кодов МКБ-10 и МКБ-11.zip`
				);
				document.body.appendChild(link);
				link.click();
				link.remove()
			} catch (e) {

			}
		} else {
			selectOption(object);
		}
	};

	return (
		<div
			className={`filter-menu-item__wrapper ${className['filter-menu-item__wrapper']}`}
			onClick={() => {onClickHandler(object)}}
		>
			<p
				className={`profile-menu-item__title ${className['profile-menu-item__title']}`}
			>
				{ title }
			</p>
		</div>
	);
}

export default FilterMenuItem;
