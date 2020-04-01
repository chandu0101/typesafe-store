
import { Template } from "./template"
import { ViewUtils } from "./utils"

export class View {

    ENTER_KEY = 13;
    ESCAPE_KEY = 27
    $todoList = document.querySelector(".todo-list")!
    $todoItemCounter = document.querySelector(".todo-count")!
    $clearCompleted = document.querySelector(".clear-completed")! as HTMLElement
    $main = document.querySelector(".main")! as HTMLElement
    $footer = document.querySelector(".footer")! as HTMLElement
    $toggleAll = document.querySelector(".toggle-all")! as HTMLInputElement
    $newTodo = document.querySelector(".new-todo")! as HTMLInputElement

    constructor(public readonly template: Template) {
        ViewUtils.delegate(this.$todoList, "li label", "dblclick", ({ target }: any) => {
            this.editItem(target)
        })
    }

    editItem = (target: any) => {
        const listItem = target.parentElement.parentElement;
        listItem.classList.add("editing")
        const input = document.createElement("input")
        input.className = "edit"
        input.value = target.innerText
        listItem.appendChild(input)
        input.focus()
    }

    showItems = (items: any) => {
        this.$todoList.innerHTML = this.template.itemList(items)
    }

    removeItem = (id: string) => {
        const elem = document.querySelector(`[data-id="${id}"]`)
        if (elem) {
            this.$todoList.removeChild(elem)
        }
    }

    setItemsleft = (itemsleft: any) => {
        this.$todoItemCounter.innerHTML = this.template.itemCounter(itemsleft)
    }

    setClearCompleteButtonVisibility = (visible: boolean) => {
        this.$clearCompleted.innerHTML = !!visible ? "block" : "none"
    }

    setMainVisibility = (visible: boolean) => {
        this.$main.style.display = !!visible ? "block" : "none"
    }

    setCompleteAllCheckbox = (checked: boolean) => {
        this.$toggleAll.checked = !!checked
    }


    updateFilterButtons = (currentPage: string) => {
        document.querySelector(".filters .selected")!.className = ""
        document.querySelector(`.filters [href="#/${currentPage}"]`)!.className = "selected"
    }

    clearNewTodo = () => {
        this.$newTodo.value = ""
    }

    setItemComplete = (id: string, completed: boolean) => {

        const listItem = document.querySelector(`[data-id="${id}"]`)!
        if (!listItem) {
            return;
        }
        listItem.className = completed ? "completed" : ""
        listItem.querySelector("input")!.checked = completed
    }

    editItemDone = (id: string, title: string) => {
        console.log("id:", id, "title: ", title)
        const listItem = document.querySelector(`[data-id="${id}"]`)!
        const input = listItem.querySelector("input.edit")!
        listItem.removeChild(input)
        listItem.classList.remove("editing")
        listItem.querySelector("label")!.textContent = title;
    }

    bindAddItem = (handler: (title: string) => any) => {
        ViewUtils.on(this.$newTodo, "change", ({ target }: any) => {
            const title = target.value.trim()
            if (title) {
                handler(title)
            }
        })
    }

    bindRemoveCompleted = (handler: any) => {
        ViewUtils.on(this.$clearCompleted, "click", handler)
    }

    bindToggleAll = (handler: any) => {
        ViewUtils.on(this.$toggleAll, "click", ({ target }: any) => {
            handler(target.checked)
        })
    }

    bindRemoveItem = (handler: any) => {
        ViewUtils.delegate(this.$todoList, ".destroy", "click", ({ target }: any) => {
            handler(this.itemId(target))
        })
    }

    bindToggleItem = (handler: any) => {
        ViewUtils.delegate(this.$todoList, ".toggle", "click", ({ target }: any) => {
            handler(this.itemId(target), target.checked)
        })
    }

    bindEditItemSave = (handler: any) => {
        ViewUtils.delegate(this.$todoList, "li .edit", "blur", ({ target }: any) => {
            if (!target.dataset.iscancelled) {
                handler(this.itemId(target), target.value.trim())
            }
        })

        ViewUtils.delegate(this.$todoList, "li .edit", "keypress", ({ target, keyCode }: any) => {
            if (keyCode === this.ENTER_KEY) {
                target.blur()
            }
        })
    }

    bindEditItemCancel = (handler: any) => {
        ViewUtils.delegate(this.$todoList, "li .edit", "keyup", ({ target, keyCode }: any) => {
            if (keyCode === this.ESCAPE_KEY) {
                target.dataset.iscanceled = true;
                target.blur()
                handler(this.itemId(target))
            }
        })
    }


    itemId = (element: any) => {
        return element.parentNode.dataset.id || element.parentNode.parentNode.dataset.id;
    }

    bindItemEditDone = (handler: any) => {
        const self = this
        ViewUtils.delegate(self.$todoList, "li .edit", "blur", function (this: any) {
            if (!this.dataset.iscancelled) {
                handler({ id: self.itemId(this), title: this.value })
            }
        })
        ViewUtils.delegate(self.$todoList, "li .edit", "keypress", function (this: any, event: any) {
            if (event.keyCode === self.ENTER_KEY) {
                this.blur()
            }
        })
    }

    bindItemEditCancel = (handler: any) => {
        const self = this
        ViewUtils.on(self.$todoList, "li .edit", "keyup", function (this: any, event: any) {
            if (event.keyCode = self.ESCAPE_KEY) {
                this.dataset.iscanceled = true;
                this.blur()
                handler({ id: self.itemId(this) })
            }
        })
    }

}

