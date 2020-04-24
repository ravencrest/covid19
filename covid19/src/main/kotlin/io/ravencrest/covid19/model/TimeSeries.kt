package io.ravencrest.covid19.model

data class TimeSeries(val country: String, val points: List<Point>) {
  fun last(): Point? {
    return this.points.lastOrNull()
  }

  fun secondToLast(): Point? {
    if (points.size < 2) {
      return null
    }
    return this.points[points.size - 2]
  }
}