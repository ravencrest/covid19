package io.ravencrest.covid19.model

data class TimeSeries(val country: String, val population: Long, val points: Set<Point>) {
  fun last(): Point? {
    return this.points.lastOrNull()
  }
}