import React from 'react';
import { fireEvent, getByRole, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from "@testing-library/user-event";
import WordList from './index';

describe('TESTS', () => {

	test('btn', () => {
		render (<WordList />);
		const $arrow = document.querySelector('.rotate-arrow');
		expect(screen.queryByText('Алфавит')).toBeNull();
		fireEvent.click($arrow);
		// userEvent.click($arrow);
		expect(screen.getByText('Алфавит')).toBeInTheDocument();
	});

	test('list', () => {
		render (<WordList />);
		const linkElement = screen.getByText('арахидный');
    expect(linkElement).toBeInTheDocument();

	});
	test('role', () => {
		render (<WordList />);
		screen.getByRole('heading');
	});

});
