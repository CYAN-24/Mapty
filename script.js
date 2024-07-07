'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const filterInputType = document.querySelector('.filter__input--type');
const sortInputType = document.querySelector('.sort__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const resetButton = document.querySelector('.reset-button');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    //prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #mapZoomLevel = 13;
  #workouts = [];
  #filteredWorkouts = false;
  #marker;
  #markers = [];

  constructor() {
    this._getPosition();
    this._getLocalStorage();
    filterInputType.addEventListener('change', this._filterType.bind(this));
    sortInputType.addEventListener('change', this._sortBy.bind(this));
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._handleWorkout.bind(this));
    resetButton.addEventListener('click', this._reset);
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('No position detected');
        }
      );
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    JSON.parse(localStorage.getItem('workouts'))?.forEach(work => {
      this._updateWorkoutMarker(work);
    });
  }

  _filterType(e) {
    const allWorkouts = document.querySelectorAll('.workout');

    switch (e.target.value) {
      case 'all':
        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        //render "all" type from #filteredWorkouts list
        this.#filteredWorkouts = this.#workouts;

        this.#filteredWorkouts.forEach(work => {
          this._renderWorkout(work);
        });

        break;
      case 'running':
        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        //render "running" type from #filteredWorkouts list
        this.#filteredWorkouts = this.#workouts.filter(
          work => work.type === 'running'
        );
        this.#filteredWorkouts.forEach(work => {
          this._renderWorkout(work);
        });

        break;
      case 'cycling':
        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        //render "cycling" type from #filteredWorkouts list
        this.#filteredWorkouts = this.#workouts.filter(
          work => work.type === 'cycling'
        );
        this.#filteredWorkouts.forEach(work => {
          this._renderWorkout(work);
        });

        break;
    }
  }

  _sortBy(e) {
    const allWorkouts = document.querySelectorAll('.workout');

    switch (e.target.value) {
      case 'date':
        if (this.#filteredWorkouts.length === 0) {
          break;
        }

        if (this.#filteredWorkouts === false) {
          this.#filteredWorkouts = this.#workouts;
        }

        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        this.#filteredWorkouts.forEach(work => {
          this._renderWorkout(work);
        });

        break;
      case 'duration':
        if (this.#filteredWorkouts.length === 0) {
          break;
        }

        if (this.#filteredWorkouts === false) {
          this.#filteredWorkouts = this.#workouts;
        }

        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        //sort to new array then loop over that new array
        [...this.#filteredWorkouts]
          .sort((a, b) => Number(a.duration) - Number(b.duration))
          .forEach(work => {
            this._renderWorkout(work);
          });

        break;
      case 'distance':
        if (this.#filteredWorkouts.length === 0) {
          break;
        }

        if (this.#filteredWorkouts === false) {
          this.#filteredWorkouts = this.#workouts;
        }

        //remove all workouts from list
        allWorkouts.forEach(work => work.remove());

        //sort to new array then loop over that new array
        [...this.#filteredWorkouts]
          .sort((a, b) => Number(a.distance) - Number(b.distance))
          .forEach(work => {
            this._renderWorkout(work);
          });

        break;
    }
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');

    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const isPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;

    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;

      if (
        !validInputs(distance, duration, cadence) ||
        !isPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !isPositive(distance, duration)
      ) {
        return alert('Inputs have to be positive numbers!');
      }

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    this.#workouts.push(workout);

    this._updateWorkoutMarker(workout);

    this._renderWorkout(workout);

    this._hideForm();

    this._setLocalStorage();
  }

  _updateWorkoutMarker(workout) {
    this.#markers.push(this._renderWorkoutMarker(workout));
  }

  _renderWorkoutMarker(workout) {
    this.#marker = L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();

    return this.#marker;
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <ion-icon class="workout__delete" name="close-outline"></ion-icon>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>`;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
    </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  _handleWorkout(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    if (e.target.closest('.workout__delete')) {
      this._deleteWorkout(workoutEl);
      return;
    }

    this._showOnMap(workoutEl);
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _showOnMap(workoutEl) {
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: { duration: 1 },
    });
  }

  _deleteWorkout(workoutEl) {
    let result = confirm('Delete this record?');
    if (result) {
      //remove workout element
      workoutEl.classList.add('remove');
      const remove = document.querySelector('.remove');
      remove.remove();

      //remove marker on map
      let selectedlat;
      let selectedlng;

      this.#workouts.forEach(work => {
        if (work.id === workoutEl.dataset.id) {
          selectedlat = work.coords[0];
          selectedlng = work.coords[1];
        }
      });

      this.#workouts = this.#workouts.filter(
        work => work.id !== workoutEl.dataset.id
      );

      this.#markers.forEach(marker => {
        if (
          marker._latlng.lat === selectedlat &&
          marker._latlng.lng === selectedlng
        ) {
          this.#map.removeLayer(marker);
        }
      });

      //set latest local storage
      this._setLocalStorage();
    }
  }

  _reset() {
    let result = confirm('Clear all records?');
    if (result) {
      localStorage.removeItem('workouts');
      location.reload();
    }
  }
}

const app = new App();
