import React from 'react';
import './Basket.style.css';

function Basket() {
	return (
		<div className="basket-img__wrapper">
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fillRule="evenodd"
					clipRule="evenodd"
					d="M17 6H19C19.5523 6 20 6.44772 20 7C20 7.55228 19.5523 8 19 8H18V17C18 18.6569 16.6569 20 15 20H9C7.34315 20 6 18.6569 6 17V8H5C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6H7V5C7 3.34315 8.34315 2 10 2H14C15.6569 2 17 3.34315 17 5V6ZM9 6H15V5C15 4.44772 14.5523 4 14 4H10C9.44772 4 9 4.44772 9 5V6ZM8 17V8H16V17C16 17.5523 15.5523 18 15 18H9C8.44771 18 8 17.5523 8 17Z"
				/>
			</svg>
		</div>
	);
}

export default Basket;
