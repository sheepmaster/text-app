/**
 * @constructor
 */
function DialogController(container) {
  this.container_ = container;
};

DialogController.prototype.show = function(callback) {
  if (this.container_.hasClass('open')) {
    console.error('Trying to open dialog when it is already visible.');
    console.error(new Error());
    return;
  }
  this.callback_ = callback;
  this.container_.addClass('open');

  // In case any new focusable elements appear, they either should be added here
  // and in onClick_, or some general code should be written to disable/enable
  // them.
  $('#editor textarea').attr('tabIndex', '-1');

  this.container_.find('.dialog-button').first().focus();
};

DialogController.prototype.resetButtons = function() {
  this.container_.find('.dialog-button').remove();
};

DialogController.prototype.addButton = function(id, text) {
  var button = $('<div class="dialog-button"></div>');
  button.attr('tabindex', '0');
  button.text(text);
  button.click(this.onClick_.bind(this, id));
  this.container_.find('.dialog-buttons').append(button);
};

DialogController.prototype.setText = function(text) {
  this.container_.find('.dialog-text').text(text);
};

DialogController.prototype.onClick_ = function(id) {
  $('#editor textarea').attr('tabIndex', '0');
  this.container_.removeClass('open');
  this.callback_(id);
};