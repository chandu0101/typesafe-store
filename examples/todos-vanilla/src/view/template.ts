import { Todo } from "../store/types";
import { ViewUtils } from "./utils";


export class Template {

    itemList = (items: Todo[]) => {
        return items.map(item => {
            return `
         <li data-id="${item.id}"${item.completed ? ' class="completed"' : ''}>
	<div class="view">
		<input class="toggle" type="checkbox" ${item.completed ? 'checked' : ''}>
		<label>${this.escapeForHTML(item.title)}</label>
		<button class="destroy"></button>
	</div>
</li>`
        }).join("")
    }

    escapeForHTML = (s: string) => s.replace(/[&<]/g, c => c === '&' ? '&amp;' : '&lt;');

    itemCounter = (activeTodos: number) => {
        const plural = activeTodos === 1 ? "" : "s"
        return `<strong> ${activeTodos} </strong> item ${plural} left`
    }

    clearCompletedButton = (completedTodos: number) => {
        if (completedTodos > 0) {
            return "clear completed"
        } else {
            return ""
        }
    }


}