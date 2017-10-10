class ExtButton extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = `
            <template>
                <button class="button"></button>
                <style> @import "style/button.css"; </style>
            </template>
        `;

        let template = this.querySelector('template'),
            shadow = this.createShadowRoot(),
            clone = document.importNode(template.content, true);

        shadow.appendChild(clone);

        this._button = shadow.querySelector('button');

        let _hideTimer;

        let role = this.getAttribute('role');
        switch(role) {
            case 'delCol':
            case 'delRow':
                this._button.classList.add('button--del');
                this._button.innerHTML = '-';
                this._initMouseHandler();
                break;
            case 'addCol':
            case 'addRow':
                this._button.classList.add('button--add');
                this.classList.add(`button--add-${role === 'addRow' ? 'row' : 'col'}-container`);
                this._button.innerHTML = '+';
                break;
        }
    }

    _initMouseHandler() {
        this._button.addEventListener('mouseover',(event) => {
            clearTimeout(this._hideTimer);
            this._button.visible = true;
        });
        this._button.addEventListener('mouseleave',() => this.visible = false);
        this._button.addEventListener('click',() => this.visible = false);
    }

    set visible(flag) {
        if (flag) {
            this._button.style.visibility = 'visible';
        } else {
            this._hideTimer = setTimeout(() => {
                this._button.style.visibility = 'hidden';
            }, 150);
        }
    }

    set positionX(pos) {
        this._button.style.left = `${pos}px`;
    }

    set positionY(pos) {
        this._button.style.top = `${pos}px`;
    }
}

class ExtTable extends HTMLElement {

    constructor() {
        super();

        this._resetControls();

        this.innerHTML = `
            <template>
                <table class="table"></table>
                <style> @import "style/table.css"; </style>
            </template>
        `;

        let template = this.querySelector('template'),
            shadow = this.createShadowRoot(),
            clone = document.importNode(template.content, true);

        shadow.appendChild(clone);

        this._table = shadow.querySelector('table');

        this._table.addEventListener('mouseover', event => {
            let target = event.target;
            if (target.tagName === 'TD') {
                this._currColumn = target.cellIndex;
                this._currX = target.getBoundingClientRect()['left'];

                this._currRow = target.parentNode.rowIndex;
                // add scrolling offset if table is not fully visible
                this._currY = target.parentNode.getBoundingClientRect()['top'] + window.pageYOffset;
            }

            this.dispatchEvent(new CustomEvent(
                'managecontrols',
                {detail: {
                    visible: true,
                    posX: this._currX,
                    posY: this._currY
                }}
            ));
        });
        this._table.addEventListener('mouseleave', () => {
            this.dispatchEvent(new CustomEvent('managecontrols', {detail: {visible: false}}));
        });

    }

    connectedCallback(){
        this._initTable();
    }

    _resetControls() {
        this._currRow = this._currColumn = this._currY = this.currX = null;
    }

    _initTable() {
        for (let i=0; i < 4; i++) {
            this.addRow();
        }
        for (let i=0; i < 4; i++) {
            this.addColumn();
        }
    }

    _addCell(row, place) {
        row.insertCell(place).classList.add('table__cell');
    }

    get rowCount() {
        return this._table.rows ? this._table.rows.length : 0;
    }

    get columnCount() {
        return this.rowCount ? this._table.rows[0].cells.length : 0;
    }

    addRow() {
        let row = this._table.insertRow(this.rows);
        if (row.cells.length < this.columnCount) {
            for (let place=0; place < this.columnCount; place++) {
                this._addCell(row, place);
            }
        }
    }

    addColumn() {
        let place = this.columnCount;
        for (let row of this._table.rows) {
            this._addCell(row, place);
        }
    }

    delRow() {
        this._table.deleteRow(this._currRow);
        this._resetControls();
    }

    delColumn() {
        for (let row of this._table.rows) {
            row.deleteCell(this._currColumn);
        }
        this._resetControls();
    }
}

class AppDrawer extends HTMLElement {
    constructor() {
        super();

        this.innerHTML =`
            <template>
                <ext-button role="delCol"></ext-button>
                <div>
                    <ext-button role="delRow"></ext-button>
                    <ext-table class="table-container"></ext-table>
                    <ext-button role="addCol"></ext-button>
                </div>
                <ext-button role="addRow"></ext-button>

                <style> @import "style/app-drawer.css"; </style>
            </template>
        `;

        let template = this.querySelector('template'),
            shadow = this.createShadowRoot(),
            clone = document.importNode(template.content, true);

        shadow.appendChild(clone);

        this.extTable = shadow.querySelector('ext-table');
        this.delColBtn = shadow.querySelector("ext-button[role='delCol']");
        this.delRowBtn = shadow.querySelector("ext-button[role='delRow']");

        shadow.querySelector("ext-button[role='addRow']").addEventListener('click', () => this.extTable.addRow());
        shadow.querySelector("ext-button[role='addCol']").addEventListener('click', () => this.extTable.addColumn());
        this.delColBtn.addEventListener('click', () => this.extTable.delColumn());
        this.delRowBtn.addEventListener('click', () => this.extTable.delRow());

        this.extTable.addEventListener('managecontrols', (event) => {
            this.delColBtn.visible = (this.extTable.columnCount === 1) ? false : event.detail.visible;
            this.delRowBtn.visible = (this.extTable.rowCount === 1) ? false : event.detail.visible;
            this.delColBtn.positionX = event.detail.posX;
            this.delRowBtn.positionY = event.detail.posY;
        });
    }

}

window.customElements.define('ext-button', ExtButton);
window.customElements.define('ext-table', ExtTable);
window.customElements.define('app-drawer', AppDrawer);
