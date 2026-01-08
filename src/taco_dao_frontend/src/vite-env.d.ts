/// <reference types="vite/client" />

declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}

declare module 'bootstrap' {
	export class Tooltip {
		constructor(element: Element, options?: any)
		show(): void
		hide(): void
		toggle(): void
		dispose(): void
		enable(): void
		disable(): void
		toggleEnabled(): void
		update(): void
		static getInstance(element: Element): Tooltip | null
		static getOrCreateInstance(element: Element, options?: any): Tooltip
	}
}
