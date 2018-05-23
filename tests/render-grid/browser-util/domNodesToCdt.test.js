'use strict';
const {describe, it} = require('mocha');
const {expect} = require('chai');
const {JSDOM} = require('jsdom');
const domNodesToCdt = require('../../../src/render-grid/browser-util/domNodesToCdt');
const {NODE_TYPES} = domNodesToCdt;
const {loadFixture, loadJsonFixture} = require('../../util/loadFixture');
const _fs = require('fs');
const {resolve: _r} = require('path');

function getElementNodes(htmlStr) {
  const dom = new JSDOM(htmlStr);
  return [dom.window.document.documentElement];
}

describe('domNodesToCdt', () => {
  it('works for DOM with 1 element', () => {
    const elementNodes = getElementNodes('<div style="color:red;">hello</div>');
    const cdt = domNodesToCdt(elementNodes);
    const expected = [
      {
        nodeType: NODE_TYPES.DOCUMENT,
        childNodeIndexes: [5],
      },
      {
        nodeType: NODE_TYPES.ELEMENT,
        nodeName: 'HEAD',
        attributes: [],
        childNodeIndexes: [],
      },
      {
        nodeType: NODE_TYPES.TEXT,
        nodeValue: 'hello',
      },
      {
        nodeType: NODE_TYPES.ELEMENT,
        nodeName: 'DIV',
        childNodeIndexes: [2],
        attributes: [{name: 'style', value: 'color:red;'}],
      },
      {
        nodeType: NODE_TYPES.ELEMENT,
        nodeName: 'BODY',
        childNodeIndexes: [3],
        attributes: [],
      },
      {
        nodeType: NODE_TYPES.ELEMENT,
        nodeName: 'HTML',
        attributes: [],
        childNodeIndexes: [1, 4],
      },
    ];
    expect(cdt).to.deep.equal(expected);
  });

  it('works for test.html', () => {
    const elementNodes = getElementNodes(loadFixture('test.html'));
    const cdt = domNodesToCdt(elementNodes);
    // _fs.writeFileSync(_r(__dirname, '../../fixtures/test.cdt.json'), JSON.stringify(cdt));
    const expectedCdt = loadJsonFixture('test.cdt.json');
    expect(cdt).to.deep.equal(expectedCdt);
  });
});
